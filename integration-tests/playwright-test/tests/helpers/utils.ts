
export function getRumRequestData(request: any) {
    if(request && request.postData()) {
        return JSON.parse(request.postData());
    }
    if (!request || !request.postData()) {
        console.error("invalid request");
        return null;
    }
}

export function parseBrowserNameToBrowserEngine(userAgent: any) {
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

export function convertToBool(currentRequestValue: any) {
    return currentRequestValue == 1;
}