const internalMockPerformance = jest.fn()

Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: internalMockPerformance,
  },
})

const mockPerformanceNavigation = (
  expectedReturnValue: Array<{ serverTiming: any }> = [{ serverTiming: [] }]
): void => {
  internalMockPerformance.mockReturnValue(expectedReturnValue)
}

export default mockPerformanceNavigation
