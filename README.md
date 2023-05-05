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