/* eslint-disable */
// @ts-nocheck
import { DEST_URL, SEND_DELAY } from '../src/constants'
import { clear, mockUserAgent } from 'jest-useragent-mock'
import sleep from './utils/sleep'
import mockPerformanceNavigation from './utils/mockServerTimings'

const validToken = '12345678-1234-abcd-ef00-1234567890ab'

describe('cdn', () => {
  let timing, webVitalsMock

  beforeEach(() => {
    jest.isolateModules(() => {
      mockUserAgent('chrome')
      document.title = 'Home'
      jest.spyOn(console, 'debug').mockImplementation()
      jest.spyOn(console, 'warn').mockImplementation()
      timing = {}
      jest.doMock('../src/getServerTiming', () => () => timing)
      webVitalsMock = require('./utils/mockWebVitals')()
      webVitalsMock.reset()
      mockPerformanceNavigation()
    })
  })

  afterEach(() => {
    clear()
  })

  it('should export Edgio.Metrics', async () => {
    const fetch = (window.fetch = jest.fn())
    require('../src/cdn')

    await new Edgio.Metrics({
      token: validToken,
      router: new Edgio.Router().match('/', ({ setPageLabel }) => setPageLabel('home')),
    }).collect()

    await sleep(SEND_DELAY + 20)

    const [url, options] = Array.from(fetch.mock.calls[0])
    expect(url).toBe(`${DEST_URL}/${validToken}`)

    expect(JSON.parse(options.body)).toEqual({
      lcp: 3,
      fid: 1,
      cls: 2,
      inp: 6,
      ttfb: 4,
      fcp: 5,
      i: 0,
      u0: 'http://localhost/',
      cn: 0,
      ux: 'http://localhost/',
      pid: expect.any(String),
      t: validToken,
      ti: 'Home',
      ua: 'chrome',
      w: 0,
      h: 0,
      cv: 'development',
      ht: null,
      l: 'home',
      l0: 'home',
      lx: 'home',
      clsel: ['#home'],
      inpel: '#casa',
    })

    expect(fetch.mock.calls.length).toBe(1)
  })

  it('should export XDN.Metrics', () => {
    expect(XDN).toBe(Edgio)
  })

  it('should export Layer0.Metrics', () => {
    expect(Layer0).toBe(Edgio)
  })
})
