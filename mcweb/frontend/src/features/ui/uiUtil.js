// included so we can later move assets to a CDN if needed
export const assetUrl = (assetPath) => `/static/${assetPath}`;

// return a URL to the helpful Google service that returns favicons for domains (pass in a URL prefixed with http or https)
export const googleFaviconUrl = (domain) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domain}&size=16`

export default assetUrl;
