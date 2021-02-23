// from https://stackoverflow.com/questions/5639346/what-is-the-shortest-function-for-reading-a-cookie-by-name-in-javascript
export default function getCookieValue(name: string) {
  var matches = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
  return matches ? matches.pop() : undefined
}
