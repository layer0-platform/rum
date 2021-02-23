import getCookieValue from '../src/getCookieValue'

describe('getCookieValue', () => {
  it('should return the value of the cookie', () => {
    document.cookie = 'xdn_eid=abc123'
    expect(getCookieValue('xdn_eid')).toBe('abc123')
  })
  it('should return undefined if the cookie does not exist', () => {
    expect(getCookieValue('xxx')).toBe(undefined)
  })
})
