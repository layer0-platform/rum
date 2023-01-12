/* istanbul ignore file */
export default function getServerTiming() {
  const timing: any = {}

  try {
    // @ts-ignore
    const serverTiming = performance.getEntriesByType('navigation')[0].serverTiming

    for (let { name, description } of serverTiming) {
      timing[name] = decodeURIComponent(description)
    }
  } catch (e) {
    console.debug('[RUM] could not obtain serverTiming metrics', e)
  }

  return timing
}
