import { DEST_URL, SEND_DELAY } from '../src/constants'
import Router from '../src/Router'
import { clear, mockUserAgent } from 'jest-useragent-mock'
import sleep from './utils/sleep'

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

    beforeEach(() => {
      jest.isolateModules(() => {
        cookies = { layer0_destination: 'A' }
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
      })
    })

    afterEach(() => {
      clear()
    })

    describe('createPayload', () => {
      it('should use the specified options', () => {
        const metrics = new Metrics({
          token: 'token',
          pageLabel: 'product',
          country: 'USA',
          appVersion: 'v1',
          cacheHit: true,
        })

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: 'token',
          l: 'product',
          l0: 'product',
          c: 'USA',
          v: 'v1',
          ht: 1,
        })
      })

      it('should use the router to determine the pageLabel', () => {
        const metrics = new Metrics({
          token: 'token',
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
          t: 'token',
        })
      })

      it('should fall back to using the XDN cache manifest if present to determine the label', async () => {
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
            token: 'token',
          })
          await metrics.collect()
          expect(JSON.parse(metrics.createPayload())).toEqual({
            ...commonParams,
            cls: 2,
            fcp: 5,
            fid: 1,
            lcp: 3,
            ttfb: 4,
            lx: '/',
            clsel: ['body'],
            t: 'token',
          })
        } finally {
          delete window.__XDN_CACHE_MANIFEST__
          webVitalsMock.setClsEntries([])
          webVitalsMock.setClsDelta(0)
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
            token: 'token',
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
            t: 'token',
          })
        } finally {
          delete window.__XDN_CACHE_MANIFEST__
          webVitalsMock.setClsEntries([])
          webVitalsMock.setClsDelta(0)
        }
      })

      it('should use server-timing headers', () => {
        document.cookie = 'layer0_destination=A'

        const metrics = new Metrics({
          token: 'token',
        })

        timing = {
          'layer0-cache': 'L1-HIT',
          'layer0-deployment-id': 'deployment-1',
          xrj: '{ "path": "/p/:id" }',
          country: 'USA',
        }

        window.navigator.connection = { effectiveType: '4g' }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: 'token',
          v: 'deployment-1',
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          ct: '4g',
        })
      })

      it('should use server-timing headers', () => {
        document.cookie = 'xdn_destination=A'

        const metrics = new Metrics({
          token: 'token',
        })

        timing = {
          'xdn-cache': 'L1-HIT',
          'xdn-deployment-id': 'deployment-2',
          xrj: '{ "path": "/p/:id" }',
          country: 'USA',
        }

        window.navigator.connection = { effectiveType: '4g' }

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          t: 'token',
          v: 'deployment-2',
          ht: 1,
          c: 'USA',
          l: '/p/:id',
          l0: '/p/:id',
          ct: '4g',
        })
      })

      it('should handle non-json xrj', () => {
        timing = {
          xrj: '/p/:id',
        }

        const metrics = new Metrics({ token: 'token' })

        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          l: '/p/:id',
          l0: '/p/:id',
          t: 'token',
        })
      })

      it('should give correct values for ht (cache hit)', () => {
        timing = {}
        let metrics = new Metrics()
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
        })

        metrics = new Metrics({ cacheHit: null })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
        })

        metrics = new Metrics({ cacheHit: 0 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 0,
        })

        metrics = new Metrics({ cacheHit: 1 })
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 1,
        })

        timing = { 'xdn-cache': 'L1-HIT' }
        metrics = new Metrics()
        expect(JSON.parse(metrics.createPayload())).toEqual({
          ...commonParams,
          ht: 1,
        })

        timing = { 'xdn-cache': 'L1-MISS' }
        metrics = new Metrics()
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
        new Metrics({ token: 'token' }).send()
        await sleep(SEND_DELAY)
        expect(sendBeacon).toHaveBeenCalled()
        const [url, body] = sendBeacon.mock.calls[0]
        expect(url).toBe(`${DEST_URL}/token`)
        expect(JSON.parse(body)).toEqual({
          ...commonParams,
          t: 'token',
        })
      })

      it('should use fetch when sendBeacon is not available', async () => {
        const fetch = (window.fetch = jest.fn())
        new Metrics({ token: 'token' }).send()
        await sleep(SEND_DELAY)
        expect(fetch).toHaveBeenCalled()
        const [url, options] = fetch.mock.calls[0]
        expect(url).toBe(`${DEST_URL}/token`)
        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          t: 'token',
        })
      })

      it('should warn if a token is not provided', async () => {
        const fetch = (window.fetch = jest.fn())
        await new Metrics({}).send()
        await sleep(SEND_DELAY + 20)
        expect(warn).toHaveBeenCalledWith(
          '[RUM] Not sending rum entry because a token was not provided.'
        )
        expect(fetch).not.toHaveBeenCalled()
      })
    })

    describe('debug', () => {
      it('should log collected metrics', async () => {
        await new Metrics({ token: 'token', debug: true }).collect()
        expect(log).toHaveBeenCalledWith('[RUM]', 'LCP', 3, expect.any(String))
        expect(log).toHaveBeenCalledWith('[RUM]', 'FID', 1, expect.any(String))
        expect(log).toHaveBeenCalledWith('[RUM]', 'CLS', 2, expect.any(String))
      })
    })

    describe('served from xdn', () => {
      it('should download the xdn cache-manifest', async () => {
        cookies['xdn_eid'] = 'abc123'
        await new Metrics({ token: 'token', debug: true }).collect()
        const scriptEl = document.head.querySelector('script[src="/__xdn__/cache-manifest.js"]')
        expect(scriptEl).toBeDefined()
      })
    })

    describe('served from layer0', () => {
      it('should download the layer0 cache-manifest', async () => {
        cookies['layer0_eid'] = 'abc123'
        await new Metrics({ token: 'token', debug: true }).collect()
        const scriptEl = document.head.querySelector('script[src="/__layer0__/cache-manifest.js"]')
        expect(scriptEl).toBeDefined()
      })
    })

    describe('collect', () => {
      let fetch, metrics

      beforeEach(() => {
        fetch = window.fetch = jest.fn()
        metrics = new Metrics({ token: 'token' })
      })

      it('should send LCP, FID, and CLS', async () => {
        await metrics.collect()
        await sleep(SEND_DELAY + 10)
        const [url, options] = Array.from(fetch.mock.calls[0])

        expect(url).toBe(`${DEST_URL}/token`)

        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          lcp: 3,
          ttfb: 4,
          cls: 2,
          fcp: 5,
          fid: 1,
          t: 'token',
        })
      })

      it('should do nothing if the browser is not chrome', async () => {
        mockUserAgent('safari')
        await metrics.collect()
        expect(fetch).not.toHaveBeenCalled()
      })

      it('should not send cls if delta is 0', async () => {
        webVitalsMock.setClsDelta(0)
        await metrics.collect()
        await sleep(SEND_DELAY + 20)
        const [url, options] = Array.from(fetch.mock.calls[0])

        expect(url).toBe(`${DEST_URL}/token`)

        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          lcp: 3,
          ttfb: 4,
          fcp: 5,
          fid: 1,
          t: 'token',
        })
      })

      it('should report if client navigation has occurred', async () => {
        await metrics.collect()
        window.history.pushState({}, 'red shoe', '/p/red-shoe')
        await metrics.collect()
        await sleep(SEND_DELAY + 20)
        const [url, options] = Array.from(fetch.mock.calls[0])

        expect(url).toBe(`${DEST_URL}/token`)

        expect(JSON.parse(options.body)).toEqual({
          ...commonParams,
          t: 'token',
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
      await new Metrics().collect()
    })
  })
})
