// TODO: funkce ktera vrati rum request
// vratit request nebo null


const TOKEN = process.env.RUM_TOKEN

export function getRumRequest(request) {
    if(request || request.postData()) {
        return true;  //RUM request je v poradku
    }
    if (!request || !request.postData()) {
        console.log("invalid request");
        return null;
    }
}

// prevede UserAgentNameBrowser na browserEngineName
export function parseUserAgentBrowserToBrowserEngineName(userAgent) {
    if (userAgent.includes('Mozilla')) {
      return 'firefox';
    } else if (userAgent.includes('Chrome')) {
      return 'chromium';
    } else if (userAgent.includes('Safari')) {
      return 'webkit';
    } else if (userAgent.includes('Edge')) {
      return 'chromium';
    } else {
      return 'Unknown';
    }
  }