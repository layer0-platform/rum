import { CACHE_MANIFEST_TIME_KEY, CACHE_MANIFEST_TTL } from '../src/constants'

describe('CacheManifest', () => {
  let CacheManifest, scriptTag, routes, cookies

  beforeEach(() => {
    jest.isolateModules(() => {
      CacheManifest = require('../src/CacheManifest').default
    })

    cookies = {}
    jest.doMock('../src/getCookieValue', () => name => cookies[name])

    routes = [
      { route: '^.*$', criteriaPath: '/all', returnsResponse: false },
      { route: '^/help$', criteriaPath: '/help', returnsResponse: true },
      { route: '^/$', criteriaPath: '/', returnsResponse: true },
    ]

    scriptTag = document.createElement('script')
    scriptTag.setAttribute('defer', 'on')
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('should download cache-manifest.js file', () => {
    const cacheManifest = new CacheManifest()

    const downloadMethod = jest.spyOn(cacheManifest, 'download')
    jest.spyOn(CacheManifest.prototype, 'isCacheFresh').mockImplementation(() => false)

    cacheManifest.load()
    expect(downloadMethod).toHaveBeenCalled()
  })

  it('should load routes from cache', () => {
    const cacheManifest = new CacheManifest()

    const getCacheRoutesMethod = jest
      .spyOn(cacheManifest, 'getCacheRoutes')
      .mockImplementation(() => routes)
    jest.spyOn(CacheManifest.prototype, 'isCacheFresh').mockImplementation(() => true)

    cacheManifest.load()
    expect(getCacheRoutesMethod).toHaveBeenCalled()
    expect(cacheManifest.getRoutes()).toBe(routes)
  })

  it('should return cache status', () => {
    const ttl = 500
    const cacheManifest = new CacheManifest(ttl)
    try {
      localStorage.setItem(
        CACHE_MANIFEST_TIME_KEY,
        (new Date().getTime() - 2 * ttl * 1000).toString()
      )
      expect(cacheManifest.isCacheFresh()).toBe(false)

      localStorage.setItem(CACHE_MANIFEST_TIME_KEY, new Date().getTime().toString())
      expect(cacheManifest.isCacheFresh()).toBe(true)
    } finally {
      localStorage.removeItem(CACHE_MANIFEST_TIME_KEY)
    }
  })

  it('should load routes from window.__EDGIO_CACHE_MANIFEST__', () => {
    const cacheManifest = new CacheManifest(0)
    try {
      window.__EDGIO_CACHE_MANIFEST__ = routes
      expect(cacheManifest.getRoutes()).toBe(routes)
    } finally {
      delete window.__EDGIO_CACHE_MANIFEST__
    }
  })

  it('should load routes from window.__LAYER0_CACHE_MANIFEST__', () => {
    const cacheManifest = new CacheManifest(0)
    try {
      window.__LAYER0_CACHE_MANIFEST__ = routes
      expect(cacheManifest.getRoutes()).toBe(routes)
    } finally {
      delete window.__LAYER0_CACHE_MANIFEST__
    }
  })

  it('should load routes from window.__XDN_CACHE_MANIFEST__', () => {
    const cacheManifest = new CacheManifest(0)
    try {
      window.__XDN_CACHE_MANIFEST__ = routes
      expect(cacheManifest.getRoutes()).toBe(routes)
    } finally {
      delete window.__XDN_CACHE_MANIFEST__
    }
  })

  it('should load /__edgio__/cache-manifest.js', () => {
    jest.spyOn(document.head, 'appendChild')
    cookies = { edgio_environment_id_info: '123' }
    new CacheManifest(0)

    scriptTag.setAttribute('src', '/__edgio__/cache-manifest.js')
    expect(document.head.appendChild).toBeCalledWith(scriptTag)
  })

  it('should load /__layer0__/cache-manifest.js', () => {
    jest.spyOn(document.head, 'appendChild')
    cookies = { layer0_environment_id_info: '123' }
    new CacheManifest(0)

    scriptTag.setAttribute('src', '/__layer0__/cache-manifest.js')
    expect(document.head.appendChild).toBeCalledWith(scriptTag)
  })

  it('should load /__xdn__/cache-manifest.js', () => {
    jest.spyOn(document.head, 'appendChild')
    new CacheManifest(0)

    scriptTag.setAttribute('src', '/__xdn__/cache-manifest.js')
    expect(document.head.appendChild).toBeCalledWith(scriptTag)
  })

  it('should have default TTL', () => {
    const cacheManifest = new CacheManifest()
    expect(cacheManifest.ttl).toBe(CACHE_MANIFEST_TTL)
  })

  it('should have custom TTL', () => {
    const cacheManifest = new CacheManifest(500)
    expect(cacheManifest.ttl).toBe(500)
  })
})
