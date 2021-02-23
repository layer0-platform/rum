import Router from '../src/Router'

describe('Router', () => {
  describe('getPageLabel', () => {
    it('should return the page label for the current url by path', () => {
      const router = new Router()
        .match('/', ({ setPageLabel }) => setPageLabel('product'))
        .match('/products/:id', ({ setPageLabel }) => setPageLabel('product'))
        .match('/categories/:id', ({ setPageLabel }) => setPageLabel('categories'))

      expect(router.getPageLabel('https://example.com/products/1')).toBe('product')
    })

    it('should return undefined when the current url path does not match a route', () => {
      const router = new Router()
        .match('/', ({ setPageLabel }) => setPageLabel('product'))
        .match('/products/:id', ({ setPageLabel }) => setPageLabel('product'))
        .match('/categories/:id', ({ setPageLabel }) => setPageLabel('categories'))

      expect(router.getPageLabel('https://example.com/help')).toBe(undefined)
    })
  })
})
