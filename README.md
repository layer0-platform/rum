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


# Typical RUM Payload
```
{
    "clsel":
    [
        "#__next > div.MuiBox-root.jss598 > div.MuiBox-root.jss1011.jss1009.jss1010 > div",
        "#oo_tab",
        "#helpButtonSpan"
    ],
    "cls": 0.05017722304271644,
    "ttfb": 351.90000000596046,
    "i": 1,
    "u0": "https://www.shoecarnival.com/",
    "cn": 0,
    "ux": "https://www.shoecarnival.com/",
    "pid": "5aa5e69a-4e0f-7ff4-e25d-b2df03d1f058",
    "t": "76b0c6f8-e4d0-480d-9c75-ee3027468c88",
    "ti": "Shoe Store: Boots, Sneakers, & More Online | Shoe Carnival",
    "d": "layer0",
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "w": 1512,
    "h": 982,
    "cv": "2.1.3",
    "ht": 1,
    "l": "/",
    "l0": "/",
    "c": "DE",
    "ct": "4g"
}
```