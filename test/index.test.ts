describe('index', () => {
  it('should export Metrics', () => {
    expect(require('../src/index')).toEqual({
      trackConversion: expect.any(Function),
      Metrics: expect.anything(),
    })
  })
})
