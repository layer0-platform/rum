import { getCLS, getFID, getLCP, Metric, getFCP, getTTFB } from 'web-vitals'
import { DEST_URL, SEND_DELAY } from './constants'
import getCookieValue from './getCookieValue'
import getServerTiming from './getServerTiming'
import isChrome from './isChrome'
import Router from './Router'
import uuid from './uuid'
import debounce from 'lodash.debounce'
import getSelectorForElement from './getSelectorForElement'

let rumClientVersion: string

try {
  rumClientVersion = require('./package.json').version
} catch (e) {
  rumClientVersion = 'development'
}

export interface MetricsOptions {
  /**
   * Your Layer0 RUM site token,
   */
  token?: string
  /**
   * A custom label to use for the current page
   */
  pageLabel?: string
  /**
   * The current version of your app
   */
  appVersion?: string
  /**
   * When running a split test, use this field to specify which variant is active
   */
  splitTestVariant?: string
  /**
   * The country in which the user is located
   */
  country?: string
  /**
   * True if the response was served from the CDN cache, false if it was not, and null if not applicable
   */
  cacheHit?: boolean
  /**
   * A router to map URL paths to page labels. Use this to defined page labels app-wide with
   * a single Metrics instance.
   */
  router?: Router
  /**
   * The URL to which to report metrics
   */
  sendTo?: string
  /**
   * Set to true to output all measurements to the console
   */
  debug?: boolean
}

interface MetricsConstructor {
  new (options: MetricsOptions): Metrics
}

interface Metrics {
  /**
   * Collects all metrics and reports them to Layer0 RUM.
   */
  collect(): Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare var Metrics: MetricsConstructor

/**
 * Collects browser performance metrics and sends them to Layer0 RUM.
 *
 * Example:
 *
 * ```js
 *  new Metrics({
 *    token: 'my-layer0-rum-token', // you can omit this is your site is deployed on Layer0
 *  }).collect()
 * ```
 */
class BrowserMetrics implements Metrics {
  private metrics: { [name: string]: number | string[] | undefined }
  private token?: string
  private options: MetricsOptions
  private sendTo: string
  private originalURL: string
  private pageID: string
  private index: number = 0
  private clientNavigationHasOccurred: boolean = false
  private layer0EnvironmentID?: string
  private splitTestVariant?: string
  private connectionType?:  string

  constructor(options: MetricsOptions = {}) {
    this.originalURL = location.href
    this.options = options
    this.layer0EnvironmentID = getCookieValue('layer0_eid') || getCookieValue('xdn_eid')
    this.token = options.token || this.layer0EnvironmentID
    this.sendTo = `${this.options.sendTo || DEST_URL}/${this.token}`
    this.pageID = uuid()
    this.metrics = this.flushMetrics()
    this.splitTestVariant = this.getSplitTestVariant()
    try {
      // @ts-ignore
      this.connectionType = navigator.connection.effectiveType
    } catch (e) {
      console.debug('could not obtain navigator.connection metrics')
    }


    /* istanbul ignore else */
    if (this.layer0EnvironmentID != null || location.hostname === 'localhost') {
      this.downloadRouteManifest()
    }
  }

  private downloadRouteManifest() {
    const scriptEl = document.createElement('script')
    scriptEl.setAttribute('defer', 'on')

    if (getCookieValue('layer0_eid')) {
      scriptEl.setAttribute('src', '/__layer0__/cache-manifest.js')
    } else {
      scriptEl.setAttribute('src', '/__xdn__/cache-manifest.js')
    }

    document.head.appendChild(scriptEl)
  }

  collect() {
    if (isChrome()) {
      // We only collect RUM on Chrome because Google only collects core web vitals using Chrome.
      return Promise.all([
        this.toPromise(getTTFB),
        this.toPromise(getFCP),
        this.toPromise(getLCP, true), // setting true here ensures we get LCP immediately
        this.toPromise(getFID),
        this.toPromise(getCLS, true), // send all CLS measurements so we can track it over time and catch CLS during client-side navigation
      ]).then(() => {})
    } else {
      return Promise.resolve()
    }
  }

  private flushMetrics() {
    return { clsel: [] }
  }

  /**
   * Returns a promise that resolves once the specified metric has been collected.
   * @param getMetric
   */
  private toPromise(getMetric: Function, ...params: any) {
    return new Promise<void>(resolve => {
      getMetric((metric: Metric) => {
        if (metric.delta === 0) {
          // metrics like LCP will get reported as a final value on first input. If there is no change from the previous measurement, don't bother reporting
          return resolve()
        }

        this.metrics[metric.name.toLowerCase()] = metric.value

        if (!this.clientNavigationHasOccurred) {
          this.clientNavigationHasOccurred = this.originalURL !== location.href
        }

        if (metric.name === 'CLS') {
          // record the CLS delta as incremental layout shift if a client side navigation has occurred
          if (this.clientNavigationHasOccurred) {
            this.metrics.ils = metric.delta
          }

          // record the element that shifted
          if (metric.entries?.length) {
            try {
              // Depending on the DOM layout, there can be MANY elements that shift during each CLS event.
              // To save on logging costs we only send the first.
              // @ts-ignore The typings appear to be wrong here - sources contains the elements causing the CLS
              const source: any = metric.entries[metric.entries.length - 1].sources[0]

              // @ts-ignore this.metrics.clsel is always initialized to an empty array
              this.metrics.clsel.push(getSelectorForElement(source.node).join(' > '))
            } catch (e) {
              // don't fail to report if generating a descriptor fails for some reason
              /* istanbul ignore next */
              console.error(e)
            }
          }
        }

        if (this.options.debug) {
          console.log('[RUM]', metric.name, metric.value, `(pageID: ${this.pageID})`)
        }

        /*
          Note: we can get the elements that shifted from CLS events by:

          metric.entries[metric.entries.length - 1].sources
            ?.filter((source: any) => source.node != null)
            .map((source: any) => source.node.outerHTML)
            .join(', ')
        */

        this.send()

        resolve()
      }, params)
    })
  }

  /**
   * Creates the data payload reported to Layer0 RUM
   */
  private createPayload() {
    const timing = getServerTiming()
    const layer0Routes = timing['xrj']
    let pageLabel = this.options.pageLabel || this.options.router?.getPageLabel(this.originalURL)

    if (!pageLabel && layer0Routes) {
      try {
        const routes = JSON.parse(layer0Routes)
        pageLabel = routes.path
      } catch (e) {
        pageLabel = layer0Routes
      }
    }

    if (!this.splitTestVariant) {
      this.splitTestVariant = this.getSplitTestVariant()
    }

    if (!this.connectionType) {
      try {
        // @ts-ignore
        this.connectionType = navigator.connection.effectiveType
      } catch (e) {
        console.debug('could not obtain navigator.connection metrics')
      }
    }

    const data: any = {
      ...this.metrics,
      i: this.index,
      u0: this.originalURL,
      cn: this.clientNavigationHasOccurred ? 1 : 0,
      ux: location.href,
      pid: this.pageID,
      t: this.token,
      ti: document.title,
      d: this.splitTestVariant,
      ua: navigator.userAgent,
      w: window.screen.width,
      h: window.screen.height,
      v: this.getAppVersion(timing),
      cv: rumClientVersion,
      ht: this.isCacheHit(timing),
      l: pageLabel, // for backwards compatibility
      l0: pageLabel,
      lx: this.getCurrentPageLabel(),
      c: this.options.country || timing['country'],
      ct: this.connectionType,
      epop: timing['edge_pop'],
    }

    this.metrics = this.flushMetrics()

    return JSON.stringify(data)
  }

  getAppVersion(timing: any) {
    return this.options.appVersion || timing['layer0-deployment-id'] || timing['xdn-deployment-id']
  }

  getSplitTestVariant() {
    return (
      this.options.splitTestVariant ||
      getCookieValue('layer0_destination') ||
      getCookieValue('xdn_destination')
    )
  }

  isCacheHit(timing: any) {
    if (this.options.cacheHit != null) {
      return this.options.cacheHit ? 1 : 0
    }
    const cache = timing['layer0-cache'] || timing['xdn-cache']
    if (cache?.includes('HIT')) return 1
    return cache?.includes('MISS') ? 0 : null
  }

  /**
   * Returns the page label for the current page using the router specified in options,
   * or, if no router is specified, matches the current URL path to the correct route
   * using the Layer0 cache manifest.
   * @returns
   */
  private getCurrentPageLabel() {
    // @ts-ignore
    const manifest = window.__LAYER0_CACHE_MANIFEST__ || window.__XDN_CACHE_MANIFEST__

    if (this.options.router) {
      return this.options.router.getPageLabel(location.href)
    } else if (manifest) {
      const matchingRoute = manifest.find(
        (entry: any) =>
          entry.returnsResponse &&
          entry.route &&
          new RegExp(entry.route, 'i').test(location.pathname)
      )
      return matchingRoute?.criteriaPath
    }
  }

  /**
   * Sends all collected metrics to Layer0 RUM.
   */
  send = debounce(() => {
    const body = this.createPayload()

    if (!this.token) {
      console.warn('[RUM] Not sending rum entry because a token was not provided.')
      return
    }

    if (!this.token.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.warn(`[RUM] Not sending rum entry because a token "${this.token}" is not valid.`)
      return
    }

    if (navigator.sendBeacon) {
      // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
      navigator.sendBeacon(this.sendTo, body)
    } else {
      fetch(this.sendTo, { body, method: 'POST', keepalive: true })
    }

    this.index++
  }, SEND_DELAY)
}

/**
 * Here we stub out Metrics so it doesn't throw an error if accidentally
 * run on the server as might happen with Nuxt, Next, etc...
 */
class ServerMetrics implements Metrics {
  constructor(options: MetricsOptions) {}

  collect() {
    return Promise.resolve()
  }
}

let MetricsType: typeof Metrics = ServerMetrics

if (typeof window !== 'undefined') {
  MetricsType = BrowserMetrics
}

export default MetricsType
