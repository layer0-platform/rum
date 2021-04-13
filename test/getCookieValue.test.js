import getCookieValue from '../src/getCookieValue'

describe('getCookieValue', () => {
  it('should return the value of the cookie', () => {
    document.cookie = 'layer0_eid=abc123'
    expect(getCookieValue('layer0_eid')).toBe('abc123')
  })
  it('should return undefined if the cookie does not exist', () => {
    expect(getCookieValue('xxx')).toBe(undefined)
  })
})
