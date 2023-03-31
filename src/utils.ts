/**
 * Returns true only if the browser is chrome.
 */
const isChrome = () => {
  return navigator.userAgent.toLowerCase().indexOf('chrome') !== -1
}

/**
 * Returns true only if the server timing is supported by the browser
 * https://caniuse.com/server-timing
 */
const isServerTimingSupported = () => {
  return getServerTiming() !== undefined
}

const getServerTiming = () => {
  return performance.getEntriesByType('navigation')[0].serverTiming
}

const getPlatform = (): null | 'edgio' | 'layer0' => {
  const serverTiming = getServerTiming()
  if (!serverTiming) return null

  for (const t of serverTiming) {
    if (t.name === 'edgio_cache') {
      return 'edgio'
    }
    // Layer0 is present on
    if (t.name === 'layer0-cache') {
      return 'layer0'
    }
  }
  return null
}

export { isChrome, isServerTimingSupported, getPlatform, getServerTiming }
