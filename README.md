# Edgio Core Web Vitals Analytics

The real user monitoring (RUM) client library
for [Edgio Core Web Vitals Analytics](https://docs.edg.io/guides/core_web_vitals).

## Releasing a New Version

To release a new version:

- Merge all changes to master.
- Update the `version` field in package.json.
- Commit and push your changes.
- Create a release in GitHub. GitHub actions will automatically publish to NPM.

## Development

We have 2 ways to building this app:

1. Using typescript (`tsc`) which is published to `./dist` and then to NPM
2. Using webpack (`webpack`) which is published to `./cdn` and then to Edgio CDN
