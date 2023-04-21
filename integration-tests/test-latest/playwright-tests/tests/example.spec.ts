import { test, expect } from '@playwright/test';
import { firefox }  from '@playwright/test';

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:8000/");
  });

  test("main navigation", async ({ page }) => {
    // Assertions use the expect API.
    await expect(page).toHaveURL("http://localhost:8000/");
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

});

async function makeHttpRequest() {
  const browser = await firefox.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', request => {
    console.log('>> Request Method:', request.method());
    console.log('>> Request URL:', request.url());
    console.log('>> Request Headers:', request.headers());
    console.log('>> Request Post Data:', request.postData());
  });
  
  page.on('response', response => {
    console.log('<< Response Status:', response.status());
    console.log('<< Response URL:', response.url());
    console.log('<< Response Headers:', response.headers());
    console.log('<< Response Text:', response.text());
  });

  // Navigate to a webpage
  await page.goto("http://localhost:8000/");


  // Close the browser
  await browser.close();
}

makeHttpRequest();

