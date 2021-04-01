module.exports = () => {
  let clsDelta = 2
  let clsEntries = null

  jest.doMock('web-vitals', () => ({
    getFCP: cb => setTimeout(() => cb({ name: 'FCP', value: 5 }), 5),
    getLCP: cb => setTimeout(() => cb({ name: 'LCP', value: 3 }), 1),
    getFID: cb => setTimeout(() => cb({ name: 'FID', value: 1 }), 2),
    getCLS: cb =>
      setTimeout(() => cb({ name: 'CLS', value: 2, delta: clsDelta, entries: clsEntries }), 3),
    getTTFB: cb => setTimeout(() => cb({ name: 'TTFB', value: 4 }), 4),
  }))

  return {
    setClsDelta(d) {
      clsDelta = d
    },

    setClsEntries(entries) {
      clsEntries = entries
    },
  }
}
