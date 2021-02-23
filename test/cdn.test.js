/* eslint-disable */
import { DEST_URL, SEND_DELAY } from '../src/constants'
import { clear, mockUserAgent } from 'jest-useragent-mock'
import sleep from './utils/sleep'

describe('cdn', () => {
  let timing

  beforeEach(() => {
    jest.isolateModules(() => {
      mockUserAgent('chrome')
      document.title = 'Home'
      jest.spyOn(console, 'debug').mockImplementation()
      timing = {}
      jest.doMock('../src/getServerTiming', () => () => timing)
      require('./utils/mockWebVitals')()
    })
  })

  afterEach(() => {
    clear()
  })

  it('should export XDN.Metrics', async done => {
    const fetch = (window.fetch = jest.fn())
    require('../src/cdn')

    await new XDN.Metrics({
      token: 'token',
      router: new XDN.Router().match('/', ({ setPageLabel }) => setPageLabel('home')),
    }).collect()

    await sleep(SEND_DELAY + 20)

    const [url, options] = Array.from(fetch.mock.calls[0])
    expect(url).toBe(`${DEST_URL}/token`)

    expect(JSON.parse(options.body)).toEqual({
      lcp: 3,
      fid: 1,
      cls: 2,
      ttfb: 4,
      fcp: 5,
      i: 0,
      u0: 'http://localhost/',
      cn: 0,
      ux: 'http://localhost/',
      pid: expect.any(String),
      t: 'token',
      ti: 'Home',
      ua: 'chrome',
      w: 0,
      h: 0,
      cv: 'development',
      ht: 0,
      l: 'home',
    })

    expect(fetch.mock.calls.length).toBe(1)

    done()
  })
})