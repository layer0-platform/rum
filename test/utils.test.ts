import { isV7orGreater, isChrome, isServerTimingSupported } from '../src/utils'
import { clear, mockUserAgent } from 'jest-useragent-mock'
import mockPerformanceNavigation from './utils/mockServerTimings'

describe('isChrome', () => {
  afterEach(clear)

  it('should return true in chrome', () => {
    mockUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'
    )
    expect(isChrome()).toBe(true)
  })

  it('should return false in safari', () => {
    mockUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    )
    expect(isChrome()).toBe(false)
  })
})

describe('isServerTimingSupported', () => {
  it('is not supported', () => {
    // On browsers which don't support it, the serverTiming is undefined
    mockPerformanceNavigation([{ serverTiming: undefined }])

    expect(isServerTimingSupported()).toBe(false)
  })

  it('is supported', () => {
    mockPerformanceNavigation([{ serverTiming: [] }])

    expect(isServerTimingSupported()).toBe(true)
  })
})

describe('getPlatform', () => {
  it('should return edgio', () => {
    mockPerformanceNavigation([{ serverTiming: [{ name: 'edgio_country' }] }])

    expect(isV7orGreater()).toBe(true)
  })

  it('should return layer0', () => {
    mockPerformanceNavigation([{ serverTiming: [{ name: 'layer0-cache' }] }])

    expect(isV7orGreater()).toBe(false)
  })

  it('should return without proper serve timing header', () => {
    mockPerformanceNavigation([{ serverTiming: [{ name: 'xxx' }] }])

    expect(isV7orGreater()).toBe(false)
  })

  it('should return null', () => {
    mockPerformanceNavigation([{ serverTiming: undefined }])

    expect(isV7orGreater()).toBe(false)
  })
})
