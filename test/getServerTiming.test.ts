// @ts-nocheck
import getServerTiming from '../src/getServerTiming'

describe('getServerTiming', () => {
  it('should URI decode the description', () => {
    window.performance.getEntriesByType = type => {
      if (type === 'navigation') {
        return [
          {
            serverTiming: [
              {
                name: 'xrj',
                description: encodeURIComponent(JSON.stringify({ path: '/' })),
              },
            ],
          },
        ]
      }
    }
    expect(getServerTiming()).toEqual({
      xrj: JSON.stringify({ path: '/' }),
    })
  })
})
