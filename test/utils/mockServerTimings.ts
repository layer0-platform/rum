const internalMockPerformance = jest.fn()

window.performance.getEntriesByType = internalMockPerformance

const mockPerformanceNavigation = (
  expectedReturnValue: Array<{ serverTiming: any }> = [{ serverTiming: [] }]
): void => {
  internalMockPerformance.mockReturnValue(expectedReturnValue)
}

export default mockPerformanceNavigation
