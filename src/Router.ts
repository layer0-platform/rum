import Route from './Route'
import RouteCallbackParams from './RouteCallbackParams'

export default class Router {
  private readonly routes: Route[] = []

  match(pattern: string, callback: (params: RouteCallbackParams) => void) {
    this.routes.push(new Route(pattern, callback))
    return this
  }

  getPageLabel(pageURL: string) {
    const url = new URL(pageURL)
    let pageLabel = undefined

    const params = {
      setPageLabel: (label: string) => (pageLabel = label),
    }

    for (let route of this.routes) {
      if (route.matches(url)) {
        route.callback(params)
      }
    }

    return pageLabel
  }
}
