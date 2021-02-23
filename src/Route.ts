import { pathToRegexp } from 'path-to-regexp'
import RouteCallbackParams from './RouteCallbackParams'

export default class Route {
  readonly callback: (params: RouteCallbackParams) => void
  private regex: RegExp

  constructor(pattern: string, callback: (params: RouteCallbackParams) => void) {
    this.regex = pathToRegexp(pattern)
    this.callback = callback
  }

  matches(url: URL) {
    return this.regex.test(url.pathname)
  }
}
