import { test, expect, Page } from '@playwright/test';
import { chromium } from '@playwright/test';
import { parseBrowserNameToBrowserEngine, getRumRequestData, convertToBool } from "./helpers/utils"

const TOKEN = "cea882df-d1bb-4547-8dce-5d0fc9a89d2b"

const WIDTH = 600;
const HEIGHT = 600;

const PAGE_LABEL = "my-label-page";  //page_label (l)
const COUNTRY = "US";               //country (c)
const APP_VERSION = "v1.0.0";       //app version(v)
const HT = true;                    //CacheHit (ht)

test.describe("RUM - Request data", () => {
  let page: Page;
  let RumRequest: any;
  let RumRequestBody: any;

  //catch Rum request and save it
  test.beforeAll(async ({ baseURL }) => {
    const browser = await chromium.launch();
    page = await browser.newPage();

    await page.setViewportSize({width: WIDTH, height: HEIGHT});

    const promiseRumRequest = new Promise((resolve, reject) => {
      page.goto(baseURL || "");

      //check if RUM request was sended
      page.on('request', request => {
        if (request.url().startsWith("https://rum.ingress.edgio.net/v1")) {
          resolve(request);
        }
      });
    });

    // console.debug("Waiting for Rum request")
    RumRequest = await promiseRumRequest
    // console.debug("Rum request happened")
    RumRequestBody = getRumRequestData(RumRequest);
  });

  test.afterAll(({ browser }) => {
    browser.close()
  });

  test('REQUEST URL - RUM fires request to correct URL', async () => {
      const correctURL = `https://rum.ingress.edgio.net/v1/${TOKEN}`;
      expect(RumRequest.url()).toBe(correctURL)
  });

  test('BODY - Browser HEIGHT/WIDTH', async () => {
      expect(RumRequestBody.w).toBe(WIDTH);
      expect(RumRequestBody.h).toBe(HEIGHT);
  });

  test('BODY - Document Title', async () => {
      expect(page).toHaveTitle(RumRequestBody.t);
  });

  test('BODY - Correct token is present', async () => {
      expect(RumRequestBody.t).toBe(TOKEN);
  });

  test('BODY - Correct label', async () => {
      expect(RumRequestBody.l).toBe(PAGE_LABEL);
  });

  test('BODY - Correct country', async () => {
      expect(RumRequestBody.c).toBe(COUNTRY);
  });

  test('BODY - Correct app version', async () => {
      expect(RumRequestBody.v).toBe(APP_VERSION);
  });

  test('BODY - Correct isCacheHit', async () => {
      let requestHt = convertToBool(RumRequestBody.ht);
      expect(requestHt).toBe(HT);
  });

  test('BODY - Correct url is present', async ({ baseURL }) => {
      let originalURL = RumRequestBody.u0;
      expect(originalURL).toBe(baseURL);
  });

  test('BODY - Correct browser', async ({ browserName }) => {

      let requestUserAgent = RumRequestBody.ua;
      let requestUserAgentEngine = parseBrowserNameToBrowserEngine(requestUserAgent);

      const navigatorUserAgent = await page.evaluate(async () => {
        return navigator.userAgent;
      });

      const browserNames = ["Chrome", "Firefox", "Safri", "Edge"];
      browserNames.forEach(browser => {
        if (navigatorUserAgent.includes(browser)) {
          let navigatorUserAgentBrowserEngine = parseBrowserNameToBrowserEngine(browser);

          expect(requestUserAgentEngine).toBe(navigatorUserAgentBrowserEngine);
          return;
        }
      });
  });

  test('BODY - Connection EffectiveType', async ({ browserName }) => {
    test.skip(browserName === 'firefox', 'NOT SUPPORTED BY BROWSER');

      //evaluation playwright
      const connectionEffectiveType = await page.evaluate(async () => {
        return navigator.connection.effectiveType;
      });

      expect(RumRequestBody.ct).toBe(connectionEffectiveType);
  });

});






