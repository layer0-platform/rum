import { test, expect } from '@playwright/test';
import { firefox, chromium, webkit } from '@playwright/test';

const TOKEN = process.env.RUM_TOKEN


test.describe("navigation", () => {
  test.beforeAll(() => {
    // cerateData
  })

  test.afterAll(() => {
    // deleteData
  })
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:8000/");
  });
  test('Check token', async ({ page }) => {
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle('Vite+Preact');
  });
  test('Check BASE URL', async ({ page }) => {
    // Expect a title "to contain" a substring.
    for (const a of await page.getByRole('listitem').all())
      await a.click();
  });  
  test('Check Broswer', async ({ page, browserName, baseURL }) => {
    const browser = await firefox.launch();
    const context = await browser.newContext();

    // Get browser version
    const browserVersion = await browser.version();
    console.log('Browser Version:', browserVersion);

    //RUM request
    page.on('request', request => {
      console.log(TOKEN);
      if (request.url() === `https://rum.ingress.layer0.co/ingress/rum/v1/${TOKEN}`) {
    
        if (!request || !request.postData()) {
          console.log("invalid request");
          return;
        }

        console.log('>> Current Browser:', browserName);
        console.log('>> Request Post Data:', request.postData());

        let jsonBody = JSON.parse(request.postData() || "");
        // figure out browsername from josnBody.useragent with useragent npm package
        // let userAgentBrowser

        console.log(jsonBody);
        console.log(browserName);
        //expect(userAgentBorowser).toHaveText;
        // expect for urls to match: jsonBody.ux
      }
    });


    // page.on('response', response => {
    //   console.log('<< Response Status:', response.status());
    //   console.log('<< Response URL:', response.url());
    //   console.log('<< Response Headers:', response.headers());
    //   console.log('<< Response Text:', response.text());
    // });


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


