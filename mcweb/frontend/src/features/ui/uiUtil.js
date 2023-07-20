import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';
import TwitterIcon from '@mui/icons-material/Twitter';
import NewspaperIcon from '@mui/icons-material/Newspaper';

// included so we can later move assets to a CDN if needed
export const assetUrl = (assetPath) => `/static/${assetPath}`;

// return a URL to the helpful Google service that returns favicons for domains (pass in a URL prefixed with http or https)
export const googleFaviconUrl = (domain) => (
  `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domain}&size=16`
);

export const sourceFavIcon = (source) => {
  // grab user images from twitter via relay
  if (source.platform === 'twitter') {
    return `https://unavatar.io/twitter/${source.name}`;
  }
  return googleFaviconUrl(source.homepage || `https://${source.domain}`);
};

export const platformDisplayName = (platform) => {
  switch (platform) {
    case 'online_news':
      return 'Online News';
    case 'youtube':
      return 'Youtube';
    case 'twitter':
      return 'Twitter';
    case 'reddit':
      return 'Reddit';
    default:
      return 'Unknown';
  }
};

export const mediaTypeDisplayName = (mediaType) => {
  switch (mediaType) {
    case 'audio_broadcast':
      return 'Audio Broadcast News';
    case 'digital_native':
      return 'Digital Native';
    case 'print_native':
      return 'Print Native';
    case 'video_broadcast':
      return 'Video Broadcast';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
};

export const asNumber = (potentialNumber) => {
  try {
    return potentialNumber.toLocaleString();
  } catch (error) {
    return potentialNumber;
  }
};

// returns a MaterialUI Widget
export const platformIcon = (platform) => {
  switch (platform) {
    case 'online_news':
      return NewspaperIcon;
    case 'youtube':
      return YouTubeIcon;
    case 'twitter':
      return TwitterIcon;
    case 'reddit':
      return RedditIcon;
    default:
      return NewspaperIcon;
  }
};

export const mask = (string) => string.replace(/./g, '*');

// trim a string by adding unicode ellipses char if it is too long
export const trimStringForDisplay = (str, maxLen) => {
  if (str.length >= maxLen) {
    return `${str.substring(0, maxLen)}…`;
  }
  return str;
};
