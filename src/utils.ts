import getServerTiming from "./getServerTiming"

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

/**
 * Indicates if the server timing is from a version 7 or greater of the Edgio App platform.
 * This function cannot guarantee that this is NOT v7 even when it is returning false as
 * it is possible that the server timing is not present and we cannot determine the version.
 */
const isV7orGreater = () => {
  const serverTiming = getServerTiming()

  if (!serverTiming) return false

  // These two might be the only ones that are present in v7
  if (serverTiming.edgio_country || serverTiming.edgio_asn) 
    return true
  
  return false
}

export { isChrome, isServerTimingSupported, isV7orGreater, getServerTiming }
