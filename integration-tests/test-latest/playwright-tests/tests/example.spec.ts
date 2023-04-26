import { test, expect, Page } from '@playwright/test';
import { firefox, chromium, webkit } from '@playwright/test';
import { parseUserAgentBrowserToBrowserEngineName, getRumRequest } from "./helpers/utils"
import { Metrics } from '@edgio/rum'
import  Edgio  from '@edgio/rum'

const TOKEN = process.env.RUM_TOKEN

const WIDTH = 600;
const HEIGHT = 600;

let page: Page;

test.describe("navigation", () => {

  let RumRequest;

  test.beforeAll(async ({ baseURL }) => {
    const browser = await chromium.launch();
    page = await browser.newPage();
    
    page.setViewportSize({ width: WIDTH, height: HEIGHT });

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

  // test.only("get country", async({page}) => {
  //   const browser = await firefox.launch();
  //   console.log("cus")
  //   page.on("request", response => {
  //     let data = JSON.parse(response.postData() || "");
  //       console.log("response<< "  + response);
  //   })
  //   console.log("cus")
  //   browser.close();
  // })
  

  // TODO: find out what is send in cv and v 
  //v - capture application version which is being monitored (verze aplikace ktera je monitorovana)
  //cv - RUM version of library (verze edgio RUM)

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
  
    if(getRumRequest(RumRequest)) {
      let jsonBody = JSON.parse(RumRequest.postData() || "");
      expect(jsonBody.w).toBe(WIDTH);
      expect(jsonBody.h).toBe(HEIGHT);
    }
  });

  // test document titlte
  test('BODY - Document Title', async ({ }) => {
    if(getRumRequest(RumRequest)) {
      let jsonBody = JSON.parse(RumRequest.postData() || "");
      expect(page).toHaveTitle(jsonBody.t);
    }
  });


    // Capture the RUM data using Edgio.Metrics
    const rumData = new Edgio.Metrics({
      pageLabel: 'home', // Set the page label
      appVersion: 'v1.0.0', // Set the app version
      country: 'US', // Set the country
    });

    console.log(rumData);

  test.only('BODY - Correct token is present', async ({ }) => {  
    if(getRumRequest(RumRequest)) { 
      let jsonBody = JSON.parse(RumRequest.postData());
      console.log("tokenIDrum:  " + jsonBody.t);
      console.log("my TOKEN:    " + TOKEN);
      expect(jsonBody.t).toBe(TOKEN);
    }
  });

  test('BODY - Correct url is present', async ({ baseURL }) => { 
    if(getRumRequest(RumRequest)) {
      let jsonBody = JSON.parse(RumRequest.postData());
      let originalURL = jsonBody.u0;
      console.log("ORIGINAL URL:  " + originalURL);
      console.log("BASE URL:      " + baseURL);
      expect(originalURL).toBe(baseURL);
    }
  });

  test('BODY - Correct browser', async ({ browserName }) => {
    if(getRumRequest(RumRequest)) {
      console.log(TOKEN);

      console.log('>> Current Browser:', browserName);
      console.log('>> Request Post Data:', RumRequest.postData());
  
      let jsonBody = JSON.parse(RumRequest.postData() || "");
      let userAgent = jsonBody.ua;
      let userAgentBrowserName = parseUserAgentBrowserToBrowserEngineName(userAgent.split('/')[0]);
      console.log("browser engine: " + userAgentBrowserName);
  
      expect(userAgentBrowserName).toBe(browserName);
    }
  });

  test("CONNECTION - EffectiveType", async ({}) => {
     //evaluation playwright
     const connectionEffectiveType = await page.evaluate(async () => {
      return  navigator.connection.effectiveType;
    });

    console.log("connection effectiveType: " + connectionEffectiveType);
  })

});




