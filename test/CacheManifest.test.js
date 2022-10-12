import CacheManifest from '../src/CacheManifest'
import { CACHE_MANIFEST_TTL } from '../src/constants'

jest.spyOn(Storage.prototype, 'setItem')
Storage.prototype.setItem = jest.fn()

describe('Metrics', () => {
  it('should have default TTL', () => {
    let cacheManifest = new CacheManifest()
    expect(cacheManifest.ttl).toBe(CACHE_MANIFEST_TTL)
  })
})
