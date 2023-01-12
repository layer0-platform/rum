// @ts-nocheck
module.exports = () => {
  let clsDelta = 2
  let clsEntries = null

  jest.doMock('web-vitals', () => ({
    onFCP: cb => setTimeout(() => cb({ name: 'FCP', value: 5 }), 5),
    onLCP: cb => setTimeout(() => cb({ name: 'LCP', value: 3 }), 1),
    onFID: cb => setTimeout(() => cb({ name: 'FID', value: 1 }), 2),
    onCLS: cb =>
      setTimeout(() => cb({ name: 'CLS', value: 2, delta: clsDelta, entries: clsEntries }), 3),
    onTTFB: cb => setTimeout(() => cb({ name: 'TTFB', value: 4 }), 4),
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
