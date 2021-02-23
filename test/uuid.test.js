describe('uuid', () => {
  describe('with crypto', () => {
    let uuid

    beforeEach(() => {
      jest.isolateModules(() => {
        window.crypto = {
          getRandomValues(buf) {
            for (let i = 0; i < buf.length; i++) {
              buf[i] = Math.round(Math.random() * 1000)
            }
          },
        }

        uuid = require('../src/uuid').default
      })
    })

    afterEach(() => {
      delete window.crypto
    })

    it('should return a unique string', () => {
      const value1 = uuid()
      const value2 = uuid()
      expect(typeof value1).toBe('string')
      expect(value1).not.toEqual(value2)
    })
  })

  describe('without crypto', () => {
    let uuid

    beforeEach(() => {
      jest.isolateModules(() => {
        delete window.crypto
        uuid = require('../src/uuid').default
      })
    })

    it('should return a unique string', () => {
      const value1 = uuid()
      const value2 = uuid()
      expect(typeof value1).toBe('string')
      expect(value1).not.toEqual(value2)
    })
  })
})
