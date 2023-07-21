// @ts-nocheck
import { DEST_URL, SEND_DELAY } from '../src/constants'
import Router from '../src/Router'
import { clear, mockUserAgent } from 'jest-useragent-mock'
import sleep from './utils/sleep'
import mockPerformanceNavigation from './utils/mockServerTimings'

// we mock the cookie function in order to be able to set the cookie value
// between tests, as the native document.cookie is "read-only", we can only
// append to it, but not change (clear) it 
const mockCookieFunction = jest.fn();

const validToken = '12345678-1234-abcd-ef00-1234567890ab'

const commonParams = {
  d: 'A',
  ti: 'Home',
  cv: 'development',
  ua: 'chrome',
  w: 0,
  h: 0,
  u0: 'http://localhost/',
  ux: 'http://localhost/',
  cn: 0,
  i: 0,
  pid: expect.any(String),
  ht: null,
  clsel: [],
}

describe('Metrics', () => {
  describe('in the browser', () => {
    let Metrics, timing, webVitalsMock, log, warn, cookies

    beforeAll(() => {
      Object.defineProperty(document, 'cookie', {
        get: mockCookieFunction
      });
    });

    beforeEach(() => {
      mockCookieFunction.mockReturnValue('');

      jest.isolateModules(() => {
        cookies = { edgio_destination: 'A' }
        log = jest.spyOn(console, 'log').mockImplementation()
        warn = jest.spyOn(console, 'warn').mockImplementation()
        mockUserAgent('chrome')
        document.title = 'Home'
        jest.spyOn(console, 'debug').mockImplementation()
        timing = {}
        jest.doMock('../src/getCookieValue', () => name => cookies[name])
        jest.doMock('../src/getServerTiming', () => () => timing)
        webVitalsMock = require('./utils/mockWebVitals')()
        Metrics = require('../src/Metrics').default
        delete window.navigator.connection
        mockPerformanceNavigation()
      })
    })

    afterEach(() => {
      clear()
    })

    describe('createPayload', () => {
      it('should use the specified options', () => {
        const metrics = new Metrics({
          token: validToken,
          pageLabel: 'product',
          country: 'USA',
          appVersion: 'v1',
          cacheHit: true,
          cacheManifestTTL: 0,
        })

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: validToken,
          l: 'product',
          l0: 'product',
          c: 'USA',
          v: 'v1',
          ht: 1,
        })
      })

      it('should use the router to determine the pageLabel', () => {
        const metrics = new Metrics({
          token: validToken,
          cacheManifestTTL: 0,
          router: new Router()
            .match('/', ({ setPageLabel }) => setPageLabel('home'))
            .match('/products/:id', ({ setPageLabel }) => setPageLabel('product'))
            .match('/categories/:id', ({ setPageLabel }) => setPageLabel('category')),
        })

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          l: 'home',
          l0: 'home',
          lx: 'home',
          t: validToken,
        })
      })

      it('should fall back to using the XDN cache manifest if present to determine the label', async () => {
        // Simulate that we are on deployed app
        cookies['layer0_environment_id_info'] = 'a28cfdde-6de2-4bd1-81e3'
        window.__XDN_CACHE_MANIFEST__ = [
          { route: '^.*$', criteriaPath: '/all', returnsResponse: false },
          { route: '^/help$', criteriaPath: '/help', returnsResponse: true },
          { route: '^/$', criteriaPath: '/', returnsResponse: true },
        ]

        webVitalsMock.setClsDelta(0.1)

        webVitalsMock.setClsEntries([
          {
            sources: [
              {
                node: document.body,
              },
            ],
          },
        ])

        try {
          const metrics = new Metrics({
            token: validToken,
            cacheManifestTTL: 0,
          })
          await metrics.collect()
          expect(JSON.parse(metrics.createPayload())).toEqual({
            ...commonParams,
            cls: 2,
            fcp: 5,
            fid: 1,
            lcp: 3,
            lx: '/',
            ttfb: 4,
            clsel: ['body'],
            t: validToken,
          })
        } finally {
          delete window.__XDN_CACHE_MANIFEST__
          webVitalsMock.setClsEntries([])
          webVitalsMock.setClsDelta(0)

          delete cookies['layer0_environment_id_info']
        }
      })

      it('should not report lx if no route is matched', async () => {
        window.__XDN_CACHE_MANIFEST__ = [
          { route: '^.*$', criteriaPath: '/all', returnsResponse: false },
          { route: '^/help$', criteriaPath: '/help', returnsResponse: true },
        ]

        webVitalsMock.setClsDelta(0.1)

        document.body.innerHTML =
          '<div id="some-element-1">Test</div><div id="some-element-2">Test</div>'

        webVitalsMock.setClsEntries([
          {
            sources: [
              {
                node: document.querySelector('#some-element-1'),
              },
              {
                node: document.querySelector('#some-element-2'),
              },
            ],
          },
        ])

        try {
          const metrics = new Metrics({
            token: validToken,
            cacheManifestTTL: 0,
          })
          await metrics.collect()
          expect(JSON.parse(metrics.createPayload())).toEqual({
            ...commonParams,
            cls: 2,
            fcp: 5,
            fid: 1,
            lcp: 3,
            ttfb: 4,
            clsel: ['#some-element-1'],
            t: validToken,
          })
        } finally {
          delete window.__XDN_CACHE_MANIFEST__
          webVitalsMock.setClsEntries([])
          webVitalsMock.setClsDelta(0)
        }
      })

      it('should use server-timing headers EC edge', () => {
        mockCookieFunction.mockReturnValue('edgio_destination=A')

        const metrics = new Metrics({
          token: validToken,
          cacheManifestTTL: 0,
        })

        timing = {
          edgio_cache: 'HIT',
          xrj: '{ "path": "/p/:id" }',
          edgio_country: 'USA',
        }

        window.navigator.connection = { effectiveType: '4g' }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: validToken,
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          ct: '4g',
        })
      })

      it('should use server-timing headers Edgio edge', () => {
        mockCookieFunction.mockReturnValue('edgio_destination=A')

        const metrics = new Metrics({
          token: validToken,
          cacheManifestTTL: 0,
        })

        timing = {
          'edgio-cache': 'L1-HIT',
          'edgio-deployment-id': 'deployment-1',
          xrj: '{ "path": "/p/:id" }',
          country: 'USA',
          asn: '15133',
        }

        window.navigator.connection = { effectiveType: '4g' }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: validToken,
          v: 'deployment-1',
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          ct: '4g',
          asn: '15133',
        })
      })

      it('should use server-timing headers XDN edge', () => {
        mockCookieFunction.mockReturnValue('edgio_destination=A')

        // Try adding connection before the constructor for full code coverage
        window.navigator.connection = { effectiveType: '4g' }

        const metrics = new Metrics({
          token: validToken,
          cacheManifestTTL: 0,
        })

        timing = {
          'xdn-cache': 'L1-HIT',
          'xdn-deployment-id': 'deployment-2',
          xrj: '{ "path": "/p/:id" }',
          country: 'USA',
        }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: validToken,
          v: 'deployment-2',
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          ct: '4g',
        })
      })

      it('should use layer0 mappings on server-timing headers (backward compatibility test)', () => {
        mockCookieFunction.mockReturnValue('edgio_destination=A')

        // Try adding connection before the constructor for full code coverage
        window.navigator.connection = { effectiveType: '4g' }

        const metrics = new Metrics({
          token: validToken,
          cacheManifestTTL: 0,
        })

        timing = {
          'edgio-cache': 'L1-HIT',
          'xdn-deployment-id': 'deployment-2',
          xrj: '{ "path": "/p/:id" }',
          country: 'USA',
        }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: validToken,
          v: 'deployment-2',
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          ct: '4g',
        })
      })

      xit('should parse information about split testing from the predefined cookie format', () => {
        mockCookieFunction.mockReturnValue('x-edg-experiment-super_exp123=red_var123; x-edg-experiment-test_test123=blue_var789;  edgio_destination=A')

        const metrics = new Metrics({
          token: validToken,
          cacheManifestTTL: 0,
        })

        timing = {
          'xdn-cache': 'L1-HIT',
          'xdn-deployment-id': 'deployment-2',
          xrj: '{ "path": "/p/:id" }',
          country: 'USA',
        }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: validToken,
          v: 'deployment-2',
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          x: [
          {
            e: 'exp123',
            v: 'var123',
          },
          {
            e: 'test123',
            v: 'var789',
          }],
        })
      })

      it('should handle non-json xrj', () => {
        mockCookieFunction.mockReturnValue('edgio_destination=A')

        timing = {
          xrj: '/p/:id',
        }

        const metrics = new Metrics({ token: validToken, cacheManifestTTL: 0 })

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          l: '/p/:id',
          l0: '/p/:id',
          t: validToken,
        })
      })

      it('should give correct values for ht (cache hit)', () => {
        timing = {}
        let metrics = new Metrics({ cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
        })

        metrics = new Metrics({ cacheHit: null, cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
        })

        metrics = new Metrics({ cacheHit: 0, cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 0,
        })

        metrics = new Metrics({ cacheHit: 1, cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 1,
        })
      })

      it('should give correct values for ht (cache hit) on EC edge', () => {
        timing = {}
        let metrics

        timing = { edgio_cache: 'L1-HIT' }
        metrics = new Metrics({ cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 1,
        })

        timing = { edgio_cache: 'L1-MISS' }
        metrics = new Metrics({ cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 0,
        })
      })

      it('should give correct values for ht (cache hit) on EC edge', () => {
        timing = {}
        let metrics

        timing = { 'xdn-cache': 'L1-HIT' }
        metrics = new Metrics({ cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 1,
        })

        timing = { 'xdn-cache': 'L1-MISS' }
        metrics = new Metrics({ cacheManifestTTL: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 0,
        })
      })
    })

    describe('send', () => {
      beforeEach(() => {
        delete window.navigator.sendBeacon
      })

      it('should use sendBeacon when available', async () => {
        const sendBeacon = (window.navigator.sendBeacon = jest.fn())
        new Metrics({ token: validToken, cacheManifestTTL: 0 }).send()

        await sleep(SEND_DELAY)

        expect(sendBeacon).toHaveBeenCalled()
        const [url, body] = sendBeacon.mock.calls[0]
        expect(url).toBe(`${DEST_URL}/${validToken}`)
        expect(JSON.parse(body)).toEqual({
          ...commonParams,
          lx: '/',
          t: validToken,
        })
      })

      it('should use fetch when sendBeacon is not available', async () => {
        const fetch = (window.fetch = jest.fn())
        new Metrics({ token: validToken, cacheManifestTTL: 0 }).send()
        await sleep(SEND_DELAY)
        expect(fetch).toHaveBeenCalled()
        const [url, options] = fetch.mock.calls[0]
        expect(url).toBe(`${DEST_URL}/${validToken}`)
        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          t: validToken,
        })
      })

      it('should warn if a token is not provided', async () => {
        const fetch = (window.fetch = jest.fn())
        await new Metrics({ cacheManifestTTL: 0 }).send()
        await sleep(SEND_DELAY + 20)
        expect(warn).toHaveBeenCalledWith(
          '[RUM] Not sending rum entry because a token was not provided.'
        )
        expect(fetch).not.toHaveBeenCalled()
      })
      it('should warn if a token is not valid', async () => {
        const fetch = (window.fetch = jest.fn())
        const badToken = validToken + '1'
        await new Metrics({ token: badToken, cacheManifestTTL: 0 }).send()
        await sleep(SEND_DELAY + 20)
        expect(warn).toHaveBeenCalledWith(
          `[RUM] Not sending rum entry because a token "${badToken}" is not valid.`
        )
        expect(fetch).not.toHaveBeenCalled()
      })
      it('should not warn if token is a valid hex', async () => {
        const fetch = (window.fetch = jest.fn())
        const hexToken = 'FFF'
        await new Metrics({ token: hexToken, cacheManifestTTL: 0 }).send()
        await sleep(SEND_DELAY + 20)
        expect(warn).not.toHaveBeenCalledWith(
          `[RUM] Not sending rum entry because a token "${hexToken}" is not valid.`
        )
        expect(fetch).toHaveBeenCalled()
      })
    })

    describe('debug', () => {
      it('should log collected metrics', async () => {
        await new Metrics({ token: validToken, debug: true, cacheManifestTTL: 0 }).collect()
        expect(log).toHaveBeenCalledWith('[RUM]', 'LCP', 3, expect.any(String))
        expect(log).toHaveBeenCalledWith('[RUM]', 'FID', 1, expect.any(String))
        expect(log).toHaveBeenCalledWith('[RUM]', 'CLS', 2, expect.any(String))
      })
    })

    describe('served from xdn', () => {
      it('should download the xdn cache-manifest', async () => {
        cookies['xdn_eid'] = 'abc123'
        await new Metrics({ token: validToken, debug: true, cacheManifestTTL: 0 }).collect()
        const scriptEl = document.head.querySelector('script[src="/__xdn__/cache-manifest.js"]')
        expect(scriptEl).toBeDefined()
      })
    })

    describe('served from layer0', () => {
      it('should download the xdn cache-manifest', async () => {
        cookies['xdn_eid'] = 'abc123'
        await new Metrics({ token: validToken, debug: true, cacheManifestTTL: 0 }).collect()
        const scriptEl = document.head.querySelector('script[src="/__layer0__/cache-manifest.js"]')
        expect(scriptEl).toBeDefined()
      })
    })

    describe('served from edgio', () => {
      it('should download the edgio cache-manifest', async () => {
        cookies['edgio_eid'] = 'abc123'
        await new Metrics({ token: validToken, debug: true, cacheManifestTTL: 0 }).collect()
        const scriptEl = document.head.querySelector('script[src="/__edgio__/cache-manifest.js"]')
        expect(scriptEl).toBeDefined()
      })
    })

    describe('collect', () => {
      let fetch, metrics

      beforeEach(() => {
        fetch = window.fetch = jest.fn()
        metrics = new Metrics({ token: validToken, cacheManifestTTL: 0 })
      })

      it('should send LCP, FID, and CLS', async () => {
        await metrics.collect()
        await sleep(SEND_DELAY + 10)
        const [url, options] = Array.from(fetch.mock.calls[0])

        expect(url).toBe(`${DEST_URL}/${validToken}`)

        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          lcp: 3,
          ttfb: 4,
          cls: 2,
          fcp: 5,
          fid: 1,
          t: validToken,
        })
      })

      it('should not send cls if delta is 0', async () => {
        webVitalsMock.setClsDelta(0)
        await metrics.collect()
        await sleep(SEND_DELAY + 20)
        const [url, options] = Array.from(fetch.mock.calls[0])

        expect(url).toBe(`${DEST_URL}/${validToken}`)

        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          lcp: 3,
          ttfb: 4,
          fcp: 5,
          fid: 1,
          t: validToken,
        })
      })

      it('should report if client navigation has occurred', async () => {
        await metrics.collect()
        window.history.pushState({}, 'red shoe', '/p/red-shoe')
        await metrics.collect()
        await sleep(SEND_DELAY + 20)
        const [url, options] = Array.from(fetch.mock.calls[0])

        expect(url).toBe(`${DEST_URL}/${validToken}`)

        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          t: validToken,
          lcp: 3,
          ttfb: 4,
          fcp: 5,
          fid: 1,
          cn: 1,
          cls: 2,
          ils: 2,
          ux: 'http://localhost/p/red-shoe',
        })
      })

      it('should send even when the browser is not chrome', async () => {
        mockUserAgent('safari')
        await metrics.collect()
        await sleep(SEND_DELAY + 20)
        expect(fetch).toHaveBeenCalled()
      })
    })
  })

  describe('on the server', () => {
    const { window } = global
    let Metrics

    beforeAll(() => {
      delete global.window
    })

    beforeEach(() => {
      jest.isolateModules(() => {
        Metrics = require('../src/Metrics').default
      })
    })

    afterAll(() => {
      global.window = window
    })

    it('runs without error', async () => {
      await new Metrics({ cacheManifestTTL: 0 }).collect()
    })
  })
})
