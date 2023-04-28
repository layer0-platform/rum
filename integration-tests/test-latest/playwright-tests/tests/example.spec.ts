import { test, expect, Page } from '@playwright/test';
import { firefox, chromium, webkit } from '@playwright/test';
import { parseBrowserNameToBrowserEngine, getRumRequest, convertToBool } from "./helpers/utils"

const TOKEN = process.env.RUM_TOKEN

const WIDTH = 600;
const HEIGHT = 600;

//dat do jineho souboru a nacitat tyto data i v index.html souboru 
const PAGE_LABEL = "my-label-page";  //page_label (l)
const COUNTRY = "US";               //country (c)
const APP_VERSION = "v1.0.0";       //app version(v)
const HT = true;                    //CacheHit (ht)

let page: Page;
let jsonBodyGLOBAL: any;

test.describe("navigation", () => {

  let RumRequest: any;

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
    jsonBodyGLOBAL = JSON.parse(RumRequest.postData());
    console.log("rum request happend")
  });

  test.afterAll(({ browser }) => {
    browser.close()
  });


  // porovnat ua z request a testovat s navigator.usarAgent v testu (TEST BROWSER)
  // testovat  pokud jsou sluzby dostupne na nasem testovanem brosweru
  // upravit vyhledavani chromu, firefox nebo safari
  // upravit RUM-build.yml

  //v - capture application version which is being monitored (verze aplikace ktera je monitorovana)
  //cv - RUM version of library (verze edgio RUM)

  test('REQUEST URL - RUM fires request to correct URL', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      const correctURL = `https://rum.ingress.layer0.co/ingress/rum/v1/${TOKEN}`;
      expect(RumRequest.url()).toBe(correctURL)
    }
  });

  test('BODY - Browser HEIGHT/WIDTH', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      //let jsonBody = JSON.parse(RumRequest.postData() || "");
      expect(jsonBodyGLOBAL.w).toBe(WIDTH);
      expect(jsonBodyGLOBAL.h).toBe(HEIGHT);
    }
  });
  test('BODY - Document Title', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      expect(page).toHaveTitle(jsonBodyGLOBAL.t);
    }
  });
  test('BODY - Correct token is present', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      console.log("tokenIDrum:  " + jsonBodyGLOBAL.t);
      console.log("my TOKEN:    " + TOKEN);
      expect(jsonBodyGLOBAL.t).toBe(TOKEN);
    }
  });
  test('BODY - Correct label', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      let requestPageLabel = jsonBodyGLOBAL.l;
      expect(requestPageLabel).toBe(PAGE_LABEL);
    }
  });
  test('BODY - Correct country', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      let requestCountry = jsonBodyGLOBAL.c;
      expect(requestCountry).toBe(COUNTRY);
    }
  });
  test('BODY - Correct app version', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      let requestAppVersion = jsonBodyGLOBAL.v;
      expect(requestAppVersion).toBe(APP_VERSION);
    }
  });
  test('BODY - Correct isCacheHit', async ({ }) => {
    if (getRumRequest(RumRequest)) {
      let requestHt = convertToBool(jsonBodyGLOBAL.ht);
      console.log(jsonBodyGLOBAL);
      expect(requestHt).toBe(HT);
    }
  });

  test('BODY - Correct url is present', async ({ baseURL }) => {
    if (getRumRequest(RumRequest)) {
      let originalURL = jsonBodyGLOBAL.u0;
      console.log("ORIGINAL URL:  " + originalURL);
      console.log("BASE URL:      " + baseURL);
      expect(originalURL).toBe(baseURL);
    }
  });

  test('BODY - Correct browser', async ({ browserName }) => {
    if (getRumRequest(RumRequest)) {
      console.log(TOKEN);

      console.log('>> Current Browser:', browserName);
      //console.log('>> Request Post Data:', RumRequest.postData());

      let requestUserAgent = jsonBodyGLOBAL.ua;
      let requestUserAgentEngine = parseBrowserNameToBrowserEngine(requestUserAgent);
      console.log("browser engine from RUM request: " + requestUserAgentEngine)

      const navigatorUserAgent = await page.evaluate(async () => {
        return navigator.userAgent;
      });

      const browserNames = ["Chrome", "Firefox", "Safri", "Edge"];
      browserNames.forEach(browser => {
        if (navigatorUserAgent.includes(browser)) {
          let navigatorUserAgentBrowserEngine = parseBrowserNameToBrowserEngine(browser);
          console.log("broser engine from NAVIGATOR.UserAgent: " + navigatorUserAgentBrowserEngine);

          expect(requestUserAgentEngine).toBe(navigatorUserAgentBrowserEngine);
          return;
        }
      });
    }
  });

  test('CONNECTION - EffectiveType', async ({ browserName }) => {
    test.skip(browserName === 'firefox', 'NOT SUPPORTED BY BROWSER');

    if (getRumRequest(RumRequest)) {
      //evaluation playwright
      const connectionEffectiveType = await page.evaluate(async () => {
        return navigator.connection.effectiveType;
      });

      console.log("connection effectiveType: " + connectionEffectiveType);
    }

  });


});






