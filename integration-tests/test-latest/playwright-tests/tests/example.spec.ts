import { test, expect } from '@playwright/test';
import { firefox, chromium, webkit } from '@playwright/test';

const TOKEN = process.env.RUM_TOKEN


test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:8000/");
  });

  test('has title', async ({ page }) => {
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle('Vite+Preact');
  });
  test('a link click', async ({ page }) => {
    // Expect a title "to contain" a substring.
    for (const a of await page.getByRole('listitem').all())
      await a.click();
  });
  test.only('Check if request and my app has same browsers', async ({ page, browserName, baseURL }) => {
    const browser = await firefox.launch();
    const context = await browser.newContext();

    // Get browser version
    const browserVersion = await browser.version();
    console.log('Browser Version:', browserVersion);

    //RUM request
    page.on('request', request => {
      console.log(TOKEN);
      if (request.url() === `https://rum.ingress.layer0.co/ingress/rum/v1/${TOKEN}`) {
    console.log('>> Request Method:', request.method());
    console.log('>> Request URL:', request.url());
    console.log('>> Request Headers:', request.headers());


        if (!request || !request.postData()) {
          console.log("invalid request");
          return;
        }

        console.log('>> Current Browser:', browserName);
        console.log('>> Request Post Data:', request.postData());

        let jsonBody = JSON.parse(request.postData() || "");
        console.log(jsonBody);
        console.log(browserName);
        expect(browserName).toEqual(jsonBody.ux);
      }
    });


  // Navigate to a webpage
  await page.goto("http://localhost:8000/");


    // Close the browser
    await browser.close();
  });
});
// Function to parse browser name from User Agent string
function parseBrowserName(userAgent) {
  if (userAgent.includes('Firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('Chrome')) {
    return 'Chrome';
  } else if (userAgent.includes('Safari')) {
    return 'Safari';
  } else if (userAgent.includes('Edge')) {
    return 'Edge';
  } else {
    return 'Unknown';
  }
}

makeHttpRequest();

