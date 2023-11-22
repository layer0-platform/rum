// @ts-nocheck
module.exports = () => {
  let clsDelta = 2
  let largestShiftTarget = '#home'

  jest.doMock('web-vitals/attribution', () => ({
    onFCP: cb => setTimeout(() => cb({ name: 'FCP', value: 5 }), 5),
    onLCP: cb => setTimeout(() => cb({ name: 'LCP', value: 3 }), 1),
    onFID: cb => setTimeout(() => cb({ name: 'FID', value: 1 }), 2),
    onCLS: cb =>
      setTimeout(
        () =>
          cb({
            name: 'CLS',
            value: 2,
            delta: clsDelta,
            attribution: { largestShiftTarget },
          }),
        3
      ),
    onTTFB: cb => setTimeout(() => cb({ name: 'TTFB', value: 4 }), 4),
    onINP: cb =>
      setTimeout(() => cb({ name: 'INP', value: 6, attribution: { eventTarget: '#casa' } }), 6),
  }))

  return {
    setClsDelta(d) {
      clsDelta = d
    },

    setLargetShiftTarget(target: string) {
      largestShiftTarget = target
    },

    reset() {
      clsDelta = 2
      largestShiftTarget = '#home'
    },
  }
}
