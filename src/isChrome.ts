/**
 * Returns true only if the browser is chrome.
 */
export default function isChrome() {
  return navigator.userAgent.toLowerCase().indexOf('chrome') !== -1
}
