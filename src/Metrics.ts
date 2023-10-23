import {
  onLCP,
  onFID,
  onCLS,
  onINP,
  onFCP,
  onTTFB,
  MetricWithAttribution,
  CLSAttribution,
  INPAttribution
} from 'web-vitals/attribution'
import { ReportOpts } from 'web-vitals/src/types'
import { CACHE_MANIFEST_TTL, DEST_URL, SEND_DELAY } from './constants'
import getCookieValue from './getCookieValue'
import { ServerTiming } from './getServerTiming'
import Router from './Router'
import uuid from './uuid'
import debounce from 'lodash.debounce'
import CacheManifest from './CacheManifest'
import { isV7orGreater, getServerTiming, isServerTimingSupported } from './utils'
import { CookiesInfo } from './CookiesInfo'

let rumClientVersion: string

try {
  rumClientVersion = require('./package.json').version
} catch (e) {
  rumClientVersion = 'development'
}

export interface MetricsPayload {
  /**
   * All unknown properties that are sent as metrics
   */
  [name: string]: number | string | string[] | undefined | null | {}

  /**
   * Index of the metric in the current page that is sent
   * */
  i: number

  /**
   *  Original Url
   * */
  u0: string

  /**
   * Client navigation has occurred
   * */
  cn: number

  /**
   * Current page location (href)
   */
  ux: string

  /**
   * Page Id
   */
  pid: string

  /**
   * Token value
   */
  t?: string

  /**
   * Document title
   * */
  ti: string

  /**
   * Edgio destination, used in Layer0 for split testing
   */
  d?: string

  /**
   * User agent
   */
  ua: string

  /**
   * Window screen width
   */
  w: number

  /**
   * Window screen height
   */
  h?: number

  /**
   * Application version, derived from deployment (Layer0/Edgio) ID
   **/
  v?: string

  /**
   * Rum client version
   * */
  cv: string

  /**
   * Indicates whether it is a cache hit or miss, 1 is for hit, 0 is for miss, null is for not applicable
   */
  ht: number | null

  /**
   * Page label. for backward compatibility
   */
  l?: string

  /**
   * Page label, either from passed from options, or from routes
   * */
  l0?: string

  /**
   * Page label, either from passed router in options, or from cache manifest (which is depricated on Edgio)
   **/
  lx?: string

  /**
   * Country
   */
  c?: string

  /**
   * Connection type
   */
  ct?: string

  /**
   * Edgio pop from timing header
   * */
  epop?: string

  /**
   * Asn from timing header
   **/
  asn?: string

  /**
   * Edgio experiment from traffic split
   * */
  x?: {
    /**
     * Experiment ID
     */
    e: string

    /**
     * Variant ID
     */
    v: string
  }[]
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
  private metrics: { [name: string]: number | string[] | string | undefined }
  private token?: string
  private options: MetricsOptions
  private sendTo: string
  private originalURL: string
  private pageID: string
  private index: number = 0
  private clientNavigationHasOccurred: boolean = false
  private edgioEnvironmentID?: string
  private destination?: string
  private connectionType?: string
  private manifest?: CacheManifest
  private cookiesInfo: CookiesInfo

  constructor(options: MetricsOptions = {}) {
    this.originalURL = location.href
    this.options = options
    this.edgioEnvironmentID = getEnvironmentCookieValue()
    this.token = options.token || this.edgioEnvironmentID
    this.sendTo = `${this.options.sendTo || DEST_URL}/${this.token}`
    this.pageID = uuid()
    this.metrics = this.flushMetrics()
    this.cookiesInfo = new CookiesInfo()

    try {
      // @ts-ignore
      this.connectionType = navigator.connection.effectiveType
    } catch (e) {
      if (this.options.debug) {
        console.debug('[RUM] could not obtain navigator.connection metrics')
      }
    }

    /* istanbul ignore else */
    if (!isV7orGreater() && this.edgioEnvironmentID !== undefined) {
      // On Edgio (v7+) we don't support cache manifest yet, so we don't need to initialize it
      this.manifest = new CacheManifest(options.cacheManifestTTL ?? CACHE_MANIFEST_TTL)
    }
  }

  collect() {
    this.sendPorkfishBeacon()

    // Server timing is not supported on browsers like Safari, this causes
    // our library report all Safari requests as Cache MISS, we need to change
    // how we handle MISS/HIT ration in the RUM Edgio BE
    if (!isServerTimingSupported()) return Promise.resolve()

    return Promise.all([
      this.toPromise(onTTFB),
      this.toPromise(onFCP),
      this.toPromise(onLCP, { reportAllChanges: true }), // setting true here ensures we get LCP immediately
      this.toPromise(onINP, { reportAllChanges: true }), // setting true here ensures we get INP immediately
      this.toPromise(onFID),
      this.toPromise(onCLS, { reportAllChanges: true }), // send all CLS measurements so we can track it over time and catch CLS during client-side navigation
    ]).then(() => {})
  }

  /**
   * Sends a beacon to Edgio Porkfish, which helps us improve anycast routing performance.
   */
  private sendPorkfishBeacon() {
    try {
      const uuid = crypto.randomUUID()
      navigator.sendBeacon(`https://${uuid}.ac.bcon.ecdns.net/udp/${this.token}`)
    } catch (e) {
      console.warn('could not send beacon', e)
    }
  }

  private flushMetrics() {
    return { clsel: [] }
  }

  /**
   * Returns a promise that resolves once the specified metric has been collected.
   * @param getMetric
   * @param params
   */
  private toPromise(getMetric: Function, params?: ReportOpts) {
    return new Promise<void>(resolve => {
      getMetric((metric: MetricWithAttribution) => {
        if (metric.delta === 0) {
          // metrics like LCP will get reported as a final value on first input. If there is no change from the previous measurement, don't bother reporting
          return resolve()
        }

        this.metrics[metric.name.toLowerCase()] = metric.value

        if (!this.clientNavigationHasOccurred) {
          this.clientNavigationHasOccurred = this.originalURL !== location.href
        }

        if (metric.name === 'INP') {
          const attribution = metric.attribution as INPAttribution
          this.metrics.inpel = attribution.eventTarget
        }

        if (metric.name === 'CLS') {
          const attribution = metric.attribution as CLSAttribution

          // record the CLS delta as incremental layout shift if a client side navigation has occurred
          if (this.clientNavigationHasOccurred) {
            this.metrics.ils = metric.delta
          }

          // record the element that shifted
          // @ts-ignore this.metrics.clsel is always initialized to an empty array
          this.metrics.clsel.push(attribution.largestShiftTarget)

          if (this.options.debug) {
            console.log(
              `[RUM] largest layout shift target: ${attribution.largestShiftTarget}`,
              `(pageID: ${this.pageID})`
            )
          }
        }

        if (this.options.debug) {
          console.log('[RUM]', metric.name, metric.value, `(pageID: ${this.pageID})`)
        }

        this.send()

        resolve()
      }, params)
    })
  }

  /**
   * Creates the data payload reported to Edgio RUM
   */
  private createPayload() {
    const timing = getServerTiming()!    
    const edgioRoutes = timing.xrj
    let pageLabel = this.options.pageLabel || this.options.router?.getPageLabel(this.originalURL)

    if (!pageLabel && edgioRoutes) {
      try {
        const routes = JSON.parse(edgioRoutes)
        pageLabel = routes.path
      } catch (e) {
        pageLabel = edgioRoutes
      }
    }

    if (!this.destination) {
      this.destination = this.getDestination()
    }

    if (!this.connectionType) {
      try {
        // @ts-ignore
        this.connectionType = navigator.connection.effectiveType
      } catch (e) {
        if (this.options.debug) {
          console.debug('[RUM] could not obtain navigator.connection metrics')
        }
      }
    }

    const data: MetricsPayload = {
      ...this.metrics,
      i: this.index,
      u0: this.originalURL,
      cn: this.clientNavigationHasOccurred ? 1 : 0,
      ux: location.href,
      pid: this.pageID,
      t: this.token,
      ti: document.title,
      d: this.destination,
      ua: navigator.userAgent,
      w: window.screen.width,
      h: window.screen.height,
      v: this.getAppVersion(timing),
      cv: rumClientVersion,
      ht: this.isCacheHit(timing),
      l: pageLabel, // for backwards compatibility
      l0: pageLabel,
      lx: this.getCurrentPageLabel(),
      c:
        this.options.country ||
        timing.edgio_country /* current convention */ ||
        timing.country /* Layer0's convention */,
      ct: this.connectionType,
      epop: timing.edgio_pop /* current convention */ || timing.edge_pop /* Layer0's convention */,
      asn: timing.edgio_asn /* current convention */ || timing.asn /* Layer0's convention */,
      // uncomment once split testing is supported on Edgio
      // x: this.getSplitTesting(),
    }

    this.metrics = this.flushMetrics()

    return JSON.stringify(data)
  }

  getSplitTesting() {
    if (this.cookiesInfo.splitTestingCookies.length === 0) {
      return undefined
    }

    return this.cookiesInfo.splitTestingCookies.map(cookie => ({
      e: cookie.experimentId,
      v: cookie.variantId,
    }))
  }

  getAppVersion(timing: ServerTiming) {
    return (
      this.options.appVersion ||
      timing['edgio-deployment-id'] ||
      timing['layer0-deployment-id'] ||
      timing['xdn-deployment-id']
    )
  }

  getDestination() {
    return (
      this.options.splitTestVariant ||
      getCookieValue('edgio_destination') ||
      getCookieValue('layer0_destination') ||
      getCookieValue('xdn_destination')
    )
  }

  isCacheHit(timing: ServerTiming) {
    if (this.options.cacheHit != null) {
      return this.options.cacheHit ? 1 : 0
    }

    if (timing.edgio_cache != null) {
      // Implementation for Edgio Application Platform
      if (timing.edgio_cache?.includes('HIT')) {
        return 1
      } else if (timing.edgio_cache != null) {
        return 0
      }
    } else {
      // Implementation for legacy Layer0 platform
      const cache = timing['edgio-cache'] || timing['layer0-cache'] || timing['xdn-cache']

      if (cache?.includes('HIT')) {
        return 1
      }

      if (cache?.includes('MISS')) {
        return 0
      }
    }

    return null
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

    if (
      // UUID or HEX string is required
      !this.token.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) &&
      !this.token.match(/^[0-9A-Fa-f]+$/)
    ) {
      console.warn(`[RUM] Not sending rum entry because a token "${this.token}" is not valid.`)
      return
    }

    if (navigator.sendBeacon) {
      // Why we use sendBea
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
