
// Note: this custom ServerTiming type is combination of the old Layer0 and Sailfish ServerTiming types.
// As for the Sailfish implementation you can find it at:
// https://gitlab.com/limelight-networks/edgecast/mirrors/http-dev/sailfish/-/commit/b7bcbafe29945dece5530509556bf954a5bae566
export type ServerTiming = {
  // Salfish type
  edge_cache?: string
  edge_country?: string

  // Layer0 type
  "edgio-cache"?: string,
  "layer0-cache"?: string,
  "xdn-cache"?: string,
  "edgio-deployment-id"?: string,
  "layer0-deployment-id"?: string,
  "xdn-deployment-id"?: string,
  country?: string

  // These are the same between Layer0 and Sailfish
  edge_pop?: string
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
    console.debug('[RUM] could not obtain serverTiming metrics', e)
  }

  return timing as ServerTiming
}
