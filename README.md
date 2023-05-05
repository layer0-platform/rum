# Edgio Core Web Vitals Analytics

The real user monitoring (RUM) client library
for [Edgio Core Web Vitals Analytics](https://docs.edg.io/guides/core_web_vitals).

See the docs for installation and usage

[![npm](https://img.shields.io/npm/v/@edgio/rum)](https://www.npmjs.com/package/@edgio/rum)
![npm type definitions](https://img.shields.io/npm/types/@edgio/rum)

## Development

### Releasing a New Version

To release a new version:

- Merge all changes to main.
- Update the `version` field in package.json.
- Commit and push your changes.
- Create a release in GitHub. 
  - GitHub actions will automatically publish to NPM.
  - The bundled latest.js files are published to the Edgio CDN.

### Build outputs

We have 2 build outputs of the package:

1. Using typescript (`tsc`) which is published to `./dist` and then to NPM
2. Using webpack (`webpack`) which is published to `./cdn` and then to Edgio CDN

### Integration tests

1. integration-tests.yml    
    - on pull request build project and run playwright tests
    - two options of get RUM request:
        - npm run use:latest
            - use latest.js file to get RUM request and load data 
        - npm run use:npm-package
            - use package to load RUM request from @edgio/rum
### VITE
2. VITE project (run on port 3000 by default)
    - store in ./rum/integration-test/test-app
    - npm run dev (run vite project locally)
    - npm npm run build (build project and save into /dist)

### Playwright
3. Playwright 
-   ./integrations-test/playwright-test/tests/example.spec.ts
        - in this file is implemented logic for playwright test (source code)
    -   test.beforeAll() function
        - start this function only one time at the beggining
        - open browser
        - catch request (RumRequest)
    -   test() functions
        - in this function is implemented code of current test
    -   test.aftreAll() function
        - start this function when all test are done
    -   ./integrations-test/playwright-test/tests/helpers/utils.ts
        - in this file are helpre functions
-   commands:
    -   run playwright test
        - npx playwright test
    -   show more information about done tests
        - npx playwright show-report
    


