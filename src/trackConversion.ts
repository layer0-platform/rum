import { DEST_URL } from "./constants";

/**
 * Options for the trackConversion function
 */
export interface TrackConversionOptions {
    /**
     *  The token for your site
     **/
    token: string

    /**
     * The name of the event to send to Edgio. 
     **/
    event: string,

    /**
     * The payload to send with the event. This can be used to send additional data to Edgio
     * that can be used to segment your audience. For example, you could send the user's email
     * address to Edgio so that you can segment your audience by email address.
     **/
    payload?: {
        [key: string]: any
    }
}

/**
 * Allows you to track a conversion event by sending an event name to Edgio for a given site.
 * @param options Options for the trackConversion function
 */
const trackConversion = async (options: TrackConversionOptions) => {
    const sendTo =  `${DEST_URL}/${options.token}/conversion`;
    const body = JSON.stringify({ event: options.event, payload: options.payload })
    
    try {
        // Attempt to send the conversion event to Edgio
        let res = await fetch(sendTo, { body, method: 'POST', keepalive: true })
            
        // if it fails, we try only once again
        if (res.ok) 
            return;

        res = await fetch(sendTo, { body, method: 'POST', keepalive: true });

        if (res.ok)
            return;

        console.error(`Failed to send conversion event to Edgio. Status: ${res.status} ${res.statusText}`);
    }
    catch(e) {
        console.error(`Failed to send conversion event to Edgio. ${e}`);
    }    
}

export default trackConversion;