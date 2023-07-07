import { test, expect, Page } from '@playwright/test';
import { chromium } from '@playwright/test';
import { getRumRequestData } from "./helpers/utils"

test.describe("RUM - trackConversion function test", () => {
  let page: Page;
  let listenerPromise: any;

  //catch Rum request and save it
  test.beforeAll(async ({ baseURL }) => {
    const browser = await chromium.launch();
    page = await browser.newPage();
    page.goto(baseURL || "");

    listenerPromise = new Promise((resolve, reject) => {
      page.on('request', request => {
        const u = request.url();
        if (u.startsWith("https://rum.ingress.layer0.co/ingress/rum/v1/") && u.endsWith("conversion")) {
          resolve(request);
        }
      });
    });

    listenerPromise.then(() => {})
  });

  test.afterAll(({ browser }) => {
    browser.close()
  });

  test('Should send data when button is clicked', async () => {
      await page.click("#counterButton")

      const result = await listenerPromise

      const data = getRumRequestData(result);
      expect(data.event).toBe("my-event");
      expect(data.payload).toBeDefined();
      expect(data.payload.email).toBe("test@test.com");
  });
});
