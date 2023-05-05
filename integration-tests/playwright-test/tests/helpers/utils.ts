
export function getRumRequest(request) {  //testuje jestli request je validni (neni pradny nebo obsahuje spravne data)
    if(request || request.postData()) {
        return true;  //RUM request is OK
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