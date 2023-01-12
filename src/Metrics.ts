import {Metric, onTTFB, onFCP, onLCP, onFID, onCLS} from 'web-vitals'
import { CACHE_MANIFEST_TTL, DEST_URL, SEND_DELAY } from './constants'
import getCookieValue from './getCookieValue'
import getServerTiming from './getServerTiming'
import Router from './Router'
import uuid from './uuid'
import debounce from 'lodash.debounce'
import getSelectorForElement from './getSelectorForElement'
import CacheManifest from './CacheManifest'

let rumClientVersion: string

try {
  rumClientVersion = require('./package.json').version
} catch (e) {
  rumClientVersion = 'development'
}

export interface MetricsOptions {
  /**
   * Your Edgio RUM site token,
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
  /**
   * The number of seconds for how long the content of cache-manifest.js file is cached in localStorage
   */
  cacheManifestTTL?: number
}

interface MetricsConstructor {
  new (options: MetricsOptions): Metrics
}

interface Metrics {
  /**
   * Collects all metrics and reports them to Edgio RUM.
   */
  collect(): Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare var Metrics: MetricsConstructor

/**
 * Collects browser performance metrics and sends them to Edgio RUM.
 *
 * Example:
 *
 * ```js
 *  new Metrics({
 *    token: 'my-edgio-rum-token', // you can omit this is your site is deployed on Edgio
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
  private edgioEnvironmentID?: string
  private splitTestVariant?: string
  private connectionType?: string
  private manifest?: CacheManifest

  constructor(options: MetricsOptions = {}) {
    this.originalURL = location.href
    this.options = options
    this.edgioEnvironmentID = getEnvironmentCookieValue()
    this.token = options.token || this.edgioEnvironmentID
    this.sendTo = `${this.options.sendTo || DEST_URL}/${this.token}`
    this.pageID = uuid()
    this.metrics = this.flushMetrics()
    this.splitTestVariant = this.getSplitTestVariant()
    try {
      // @ts-ignore
      this.connectionType = navigator.connection.effectiveType
    } catch (e) {
      if(this.options.debug){
        console.debug('[RUM] could not obtain navigator.connection metrics')
      }
    }

    /* istanbul ignore else */
    if (this.edgioEnvironmentID != null || location.hostname === 'localhost') {
      this.manifest = new CacheManifest(options.cacheManifestTTL ?? CACHE_MANIFEST_TTL)
    }
  }

  collect() {
    return Promise.all([
      this.toPromise(onTTFB),
      this.toPromise(onFCP),
      this.toPromise(onLCP, true), // setting true here ensures we get LCP immediately
      this.toPromise(onFID),
      this.toPromise(onCLS, true), // send all CLS measurements so we can track it over time and catch CLS during client-side navigation
    ]).then(() => {})
}

  private flushMetrics() {
    return { clsel: [] }
  }

  /**
   * Returns a promise that resolves once the specified metric has been collected.
   * @param getMetric
   * @param params
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
   * Creates the data payload reported to Edgio RUM
   */
  private createPayload() {
    const timing = getServerTiming()
    const edgioRoutes = timing['xrj']
    let pageLabel = this.options.pageLabel || this.options.router?.getPageLabel(this.originalURL)

    if (!pageLabel && edgioRoutes) {
      try {
        const routes = JSON.parse(edgioRoutes)
        pageLabel = routes.path
      } catch (e) {
        pageLabel = edgioRoutes
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

        if(this.options.debug){
          console.debug('[RUM] could not obtain navigator.connection metrics')
        }
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
    return (
      this.options.appVersion ||
      timing['edgio-deployment-id'] ||
      timing['layer0-deployment-id'] ||
      timing['xdn-deployment-id']
    )
  }

  getSplitTestVariant() {
    return (
      this.options.splitTestVariant ||
      getCookieValue('edgio_destination') ||
      getCookieValue('layer0_destination') ||
      getCookieValue('xdn_destination')
    )
  }

  isCacheHit(timing: any) {
    if (this.options.cacheHit != null) {
      return this.options.cacheHit ? 1 : 0
    }
    const cache = timing['edgio-cache'] || timing['layer0-cache'] || timing['xdn-cache']
    if (cache?.includes('HIT')) return 1
    return cache?.includes('MISS') ? 0 : null
  }

  /**
   * Returns the page label for the current page using the router specified in options,
   * or, if no router is specified, matches the current URL path to the correct route
   * using the Edgio cache manifest.
   * @returns
   */
  private getCurrentPageLabel() {
    const manifest = this.manifest?.getRoutes() ?? []

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
   * Sends all collected metrics to Edgio RUM.
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

const getEnvironmentCookieValue = () => {
  return (
    getCookieValue('edgio_environment_id_info') ||
    getCookieValue('edgio_eid') ||
    getCookieValue('layer0_environment_id_info') ||
    getCookieValue('layer0_eid') ||
    getCookieValue('xdn_environment_id_info') ||
    getCookieValue('xdn_eid')
  )
}

/**
 * Here we stub out Metrics so it doesn't throw an error if accidentally
 * run on the server as might happen with Nuxt, Next, etc...
 */
class ServerMetrics implements Metrics {
  constructor(_: MetricsOptions) {}

  collect() {
    return Promise.resolve()
  }
}

let MetricsType: typeof Metrics = ServerMetrics

if (typeof window !== 'undefined') {
  MetricsType = BrowserMetrics
}

export default MetricsType
