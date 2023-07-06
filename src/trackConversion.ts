import { DEST_URL } from "./constants";

/**
 * Options for the trackConversion function
 */
export interface TrackConversionOptions {
    // The token for your site
    token: string

    // The event name to track
    event: string
}

/**
 * Allows you to track a conversion event by sending an event name to Edgio for a given site.
 * @param options Options for the trackConversion function
 */
export const trackConversion = (options: TrackConversionOptions) => {
    const sendTo =  `${DEST_URL}/${options.token}/conversion}`;
    const body = JSON.stringify({ event: options.event })
    fetch(sendTo, { body, method: 'POST', keepalive: true })
}