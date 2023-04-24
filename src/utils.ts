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

/**
 * Indicates if the server timing is from a version 7 or greater of the Edgio App platform.
 * This function cannot guarantee that this is NOT v7 even when it is returning false as
 * it is possible that the server timing is not present and we cannot determine the version.
 */
const isV7orGreater = () => {
  const serverTiming = getServerTiming()

  if (!serverTiming) return false

  for (const t of serverTiming) {
    // These two might be the only ones that are present in v7
    if (t.name === 'edgio_country' || t.name === 'edgio_asn') {
      return true
    }
  }

  return false
}

export { isChrome, isServerTimingSupported, isV7orGreater, getServerTiming }
