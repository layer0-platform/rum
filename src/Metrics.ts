import { getCLS, getFID, getLCP, Metric, getFCP, getTTFB } from 'web-vitals'
import { DEST_URL, SEND_DELAY } from './constants'
import getCookieValue from './getCookieValue'
import getServerTiming from './getServerTiming'
import isChrome from './isChrome'
import Router from './Router'
import uuid from './uuid'
import debounce from 'lodash.debounce'

let rumClientVersion: string

try {
  rumClientVersion = require('./package.json').version
} catch (e) {
  rumClientVersion = 'development'
}

export interface MetricsOptions {
  /**
   * Your XDN RUM site token,
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
   * True if the response was served from the CDN cache, otherwise false
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

/**
 * Collects browser performance metrics and sends them to Moovweb RUM.
 */
export default class Metrics {
  private metrics: { [name: string]: number | undefined } = {}
  private token?: string
  private options: MetricsOptions
  private sendTo: string
  private originalURL: string
  private pageID: string
  private index: number = 0
  private clientNavigationHasOccurred: boolean = false

  constructor(options: MetricsOptions = {}) {
    this.originalURL = location.href
    this.options = options
    this.token = options.token || getCookieValue('xdn_eid')
    this.sendTo = `${this.options.sendTo || DEST_URL}/${this.token}`
    this.pageID = uuid()
  }

  async collect() {
    if (isChrome()) {
      // We only collect RUM on Chrome because Google only collects core web vitals using Chrome.
      return Promise.all([
        this.toPromise(getTTFB),
        this.toPromise(getFCP),
        this.toPromise(getLCP, true), // setting true here ensures we get LCP immediately
        this.toPromise(getFID),
        this.toPromise(getCLS, true), // send all CLS measurements so we can track it over time and catch CLS during client-side navigation
      ])
    }
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

        // record the CLS delta as incremental layout shift if a client side navigation has occurred
        if (metric.name === 'CLS' && this.clientNavigationHasOccurred) {
          this.metrics.ils = metric.delta
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
   * Creates the data payload reported to Moovweb RUM
   */
  private createPayload() {
    const timing = getServerTiming()
    const xdnRoutes = timing['xrj']
    let pageLabel = this.options.pageLabel || this.options.router?.getPageLabel(location.href)

    if (!pageLabel && xdnRoutes) {
      try {
        const routes = JSON.parse(xdnRoutes)
        pageLabel = routes.path
      } catch (e) {
        pageLabel = xdnRoutes
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
      d: this.options.splitTestVariant || getCookieValue('xdn_destination'),
      ua: navigator.userAgent,
      w: window.screen.width,
      h: window.screen.height,
      v: this.options.appVersion || timing['xdn-deployment-id'],
      cv: rumClientVersion,
      ht: this.options.cacheHit || timing['xdn-cache']?.includes('HIT') ? 1 : 0,
      l: pageLabel,
      c: this.options.country || timing['country'],
    }

    try {
      // @ts-ignore
      data.ct = navigator.connection.effectiveType
    } catch (e) {
      console.debug('could not obtain navigator.connection metrics')
    }

    return JSON.stringify(data)
  }

  /**
   * Sends all collected metrics to Moovweb RUM.
   */
  send = debounce(() => {
    const body = this.createPayload()

    if (!this.token) {
      console.warn('[RUM] Not sending rum entry because a token was not provided.')
      return
    }

    if (navigator.sendBeacon) {
      // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
      navigator.sendBeacon(this.sendTo, body)
    } else {
      fetch(this.sendTo, { body, method: 'POST', keepalive: true })
    }

    this.metrics = {}
    this.index++
  }, SEND_DELAY)
}