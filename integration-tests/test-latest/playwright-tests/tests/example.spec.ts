import { test, expect, Page } from '@playwright/test';
import { firefox, chromium, webkit } from '@playwright/test';
import { parseUserAgentBrowserToBrowserEngineName, getRumRequest } from "./helpers/utils"

const TOKEN = process.env.RUM_TOKEN


let page: Page;

test.describe("navigation", () => {

  let RumRequest;

  test.beforeAll(async ({ baseURL }) => {
    const browser = await firefox.launch();
    page = await browser.newPage();

    const promiseRumRequest = new Promise((resolve, reject) => {
      page.goto(baseURL || "");

      //check if RUM request was sended
      page.on('request', request => {
        if (request.url().startsWith("https://rum.ingress.layer0.co/ingress/rum/v1/")) {
          resolve(request);
        }
      });
    });

    console.log("waiting for rum request")
    RumRequest = await promiseRumRequest
    console.log("rum request happend")
  });

  test.afterAll(({ browser }) => {
    browser.close()
    
  });

  // TODO: find out what is send in cv and v 
  //v - capture application version which is being monitored (verze aplikace ktera je monitorovana)
  //cv - RUM version of library   (verze edgio RUM)

  // test zda vubec poslal nejaky request na spravno URL || rum fires requset to correct url 
  // je tam request, a ma v url TOKEN
  test('REQUEST URL - RUM fires request to correct URL', async ({ }) => {
    if(getRumRequest(RumRequest)) {
      const correctURL = `https://rum.ingress.layer0.co/ingress/rum/v1/${TOKEN}`;
      expect(RumRequest.url()).toBe(correctURL)
    }
  });

  // browser width / height  (nastavit na tvrdo)
  // test melo by jit nastavit kdyz davas firefox.launch()
  test('BODY - Browser HEIGHT/WIDTH', async ({ }) => {
    const WIDTH = 600;
    const HEIGHT = 600;
    page.setViewportSize({ width: WIDTH, height: HEIGHT });

    let jsonBody = JSON.parse(RumRequest.postData() || "");
    expect(jsonBody.w).toBe(WIDTH);
    expect(jsonBody.h).toBe(HEIGHT);
  });

  // test document titlte
  test('BODY - Document Title', async ({ }) => {
    let jsonBody = JSON.parse(RumRequest.postData() || "");
    expect(page).toHaveTitle(jsonBody.t);
  });

  test('BODY - Correct token is present', async ({ }) => {
    let jsonBody = JSON.parse(RumRequest.postData());
    console.log("tokenIDrum:  " + jsonBody.t);
    console.log("my TOKEN:    " + TOKEN);
    expect(jsonBody.t).toBe(TOKEN);
  });

  test('BODY - Correct url is present', async ({ baseURL }) => {
    let jsonBody = JSON.parse(RumRequest.postData());
    let originalURL = jsonBody.ux;
    console.log("ORIGINAL URL:  " + originalURL);
    console.log("BASE URL:      " + baseURL);
    expect(originalURL).toBe(baseURL);
  });

  test('BODY - Correct browser', async ({ browserName }) => {
    console.log(TOKEN);

    console.log('>> Current Browser:', browserName);
    console.log('>> Request Post Data:', RumRequest.postData());

    let jsonBody = JSON.parse(RumRequest.postData() || "");
    let userAgent = jsonBody.ua;
    let userAgentBrowserName = parseUserAgentBrowserToBrowserEngineName(userAgent.split('/')[0]);
    console.log("browser engine: " + userAgentBrowserName);

    expect(userAgentBrowserName).toBe(browserName);

  });

});



