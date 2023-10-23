// Note: this custom ServerTiming type is combination of the old Layer0 and Sailfish ServerTiming types.
// As for the Sailfish implementation you can find it at:
// https://gitlab.com/limelight-networks/edgecast/mirrors/http-dev/sailfish/-/commit/b7bcbafe29945dece5530509556bf954a5bae566
export type ServerTiming = {
    // These are the current names returned by the Edgio App plafform (Sailfish)
    edgio_cache?: string
    edgio_pop?: string
    edgio_country?: string
    edgio_asn?: string
  
    // These are the legacy names returned by Layer0
    'edgio-cache'?: string
    'layer0-cache'?: string
    'xdn-cache'?: string
    'edgio-deployment-id'?: string
    'layer0-deployment-id'?: string
    'xdn-deployment-id'?: string
    country?: string
    asn?: string
    edge_pop?: string
    xrj?: string
  }
  

/* istanbul ignore file */
export default function getServerTiming() {
  const timing: Record<string, string> = {}

  try {
    const serverTiming = performance.getEntriesByType('navigation')[0].serverTiming
    
    if (!serverTiming) return undefined
    
    for (let { name, description } of serverTiming) {
      timing[name] = decodeURIComponent(description)
    }
  } catch (e) {
    console.debug('[RUM] could not obtain serverTiming metrics', e)
  }

  return timing
}