// TODO: funkce ktera vrati rum request
// vratit request nebo null

export function getRumRequest(request) {  //testuje jeslti request je validni (neni pradny nebo obsahuje spravme data)
    if(request || request.postData()) {
        return true;  //RUM request je v poradku
    }
    if (!request || !request.postData()) {
        console.log("invalid request");
        return null;
    }
}

// prevede UserAgentNameBrowser na browserEngineName
export function parseBrowserNameToBrowserEngine(userAgent) {
    if (userAgent.includes('Firefox')) {
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

export function convertToBool(currentRequestValue) {
    if(currentRequestValue == 1) {
        return true;
    }
    return false;
}