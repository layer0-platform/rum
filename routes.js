const { Router } = require('@xdn/core/router')

const TTL = {
  browser: {
    maxAgeSeconds: 60 * 60 * 24,
  },
  edge: {
    maxAgeSeconds: 60 * 60 * 24 * 365,
  },
}

module.exports = new Router()
  .get('/latest.js', ({ cache, serveStatic }) => {
    cache({
      ...TTL,
      browser: {
        maxAgeSeconds: 60 * 60,
      },
    })
    serveStatic('cdn/latest.js')
  })
  .get('/:version', ({ cache, serveStatic }) => {
    cache(TTL)
    serveStatic('cdn/:version', { permanent: true, exclude: ['latest.js'] })
  })
  .fallback(({ send }) => {
    send('', 404, 'not found')
  })