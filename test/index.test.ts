describe('index', () => {
  it('should export Metrics', () => {
    expect(require('../src/index')).toEqual({
      Metrics: expect.anything(),
    })
  })
})
