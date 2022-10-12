import { CACHE_MANIFEST_DATA_KEY, CACHE_MANIFEST_TIME_KEY, CACHE_MANIFEST_TTL } from './constants'
import getCookieValue from './getCookieValue'

/**
 * Loads the routes from cache-manifest.js file
 * and cache them in localStorage for specified period of time.
 *
 * Example:
 *
 * ```js
 *  let cacheManifest = new CacheManifest(3600); // cache routes for 1 hour
 *  let routes = cacheManifest().getRoutes();
 * ```
 */
export default class CacheManifest {
  private ttl: number
  private routes: Array<any>

  /**
     @param ttl The number of seconds for how long the routes are cached
     */
  constructor(ttl: number = CACHE_MANIFEST_TTL) {
    this.ttl = ttl > 0 ? ttl : 0
    this.routes = []
    this.load()
  }

  /**
   * Loads the routes either from localStorage cache or from cache-manifest.js file
   */
  private load(): void {
    if (!this.isCacheFresh()) {
      this.download()
      return
    }
    this.routes = this.getCacheroutes()
  }

  /**
   * @returns The array of routes
   */
  public getRoutes(): Array<any> {
    // when routes was loaded, return them
    if (this.routes && this.routes.length > 0) {
      return this.routes
    }

    // when routes was downloaded, save them to local cache
    // @ts-ignore
    let windowManifest =
      window.__EDGIO_CACHE_MANIFEST__ ||
      window.__LAYER0_CACHE_MANIFEST__ ||
      window.__XDN_CACHE_MANIFEST__
    if (windowManifest) {
      this.routes = windowManifest
      this.setCacheroutes(this.routes)
      this.setCacheTime(new Date().getTime())
    }

    return this.routes
  }

  /**
   * Returns the time of cache creation from localStorage
   * @returns The time of cache creation or null
   */
  private getCacheTime(): number | null {
    let time = localStorage.getItem(CACHE_MANIFEST_TIME_KEY)
    return time ? parseInt(time) : null
  }

  /**
   * Sets the time of cache creation to localStorage
   */
  private setCacheTime(time: number): void {
    localStorage.setItem(CACHE_MANIFEST_TIME_KEY, time.toString())
  }

  /**
   * Returns the array of routes from localStorage cache
   * @returns Array<any>
   */
  private getCacheroutes(): Array<any> {
    return JSON.parse(localStorage.getItem(CACHE_MANIFEST_DATA_KEY) ?? '[]')
  }

  /**
   * Saves the array of routes to localStorage cache
   */
  private setCacheroutes(routes: Array<any>): void {
    localStorage.setItem(CACHE_MANIFEST_DATA_KEY, JSON.stringify(routes))
  }

  /**
   * Returns the true when localStorage cache is not expired
   * @returns boolean
   */
  private isCacheFresh(): boolean {
    let cacheSavedTime = this.getCacheTime()
    return cacheSavedTime != null && new Date().getTime() - cacheSavedTime <= this.ttl * 1000
  }

  /**
   * Downloads the cache-manifest.js file by adding it to script tag
   */
  private download() {
    const scriptEl = document.createElement('script')
    scriptEl.setAttribute('defer', 'on')

    if (getCookieValue('edgio_environment_id_info')) {
      scriptEl.setAttribute('src', '/__edgio__/cache-manifest.js')
      document.head.appendChild(scriptEl)
      return
    }
    if (getCookieValue('layer0_environment_id_info')) {
      scriptEl.setAttribute('src', '/__layer0__/cache-manifest.js')
      document.head.appendChild(scriptEl)
      return
    }
    scriptEl.setAttribute('src', '/__xdn__/cache-manifest.js')
    document.head.appendChild(scriptEl)
  }
}
