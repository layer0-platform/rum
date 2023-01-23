
// This type is constructed from the implementation in Sailfish which can be found here:
// https://gitlab.com/limelight-networks/edgecast/mirrors/http-dev/sailfish/-/commit/b7bcbafe29945dece5530509556bf954a5bae566
export type ServerTiming = {
  edge_cache?: string
  edge_pop?: string
  edge_country?: string
  xrj?: string
}

/* istanbul ignore file */
export default function getServerTiming() {
  const timing: Record<string, string> = {}

  try {
    // @ts-ignore
    const serverTiming = performance.getEntriesByType('navigation')[0].serverTiming

    for (let { name, description } of serverTiming) {
      timing[name] = decodeURIComponent(description)
    }
  } catch (e) {
    console.debug('could not obtain serverTiming metrics', e)
  }

  return timing as ServerTiming
}
