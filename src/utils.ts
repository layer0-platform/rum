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
    return performance.getEntriesByType('navigation')[0].serverTiming !== undefined;
}

export {
    isChrome,
    isServerTimingSupported
}