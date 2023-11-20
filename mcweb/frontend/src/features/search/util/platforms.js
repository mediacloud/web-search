import dayjs from 'dayjs';

// keep in sync with mcweb/frontend/views.py

export const PLATFORM_TWITTER = 'twitter';
export const PLATFORM_REDDIT = 'reddit';
export const PLATFORM_YOUTUBE = 'youtube';
export const PLATFORM_ONLINE_NEWS = 'onlinenews';

export const PLATFORM_SOURCE_PUSHSHIFT = 'pushshift';
export const PLATFORM_SOURCE_TWITTER = 'twitter';
export const PLATFORM_SOURCE_YOUTUBE = 'youtube';
export const PLATFORM_SOURCE_WAYBACK_MACHINE = 'waybackmachine';
export const PLATFORM_SOURCE_MEDIA_CLOUD_LEGACY = 'mclegacy';
export const PLATFORM_SOURCE_MEDIA_CLOUD = 'mediacloud';

const providerName = (platform, source) => `${platform}-${source}`;

// synthetic constants to make life easier here
export const PROVIDER_TWITTER_TWITTER = providerName(PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER);

export const PROVIDER_NEWS_WAYBACK_MACHINE = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_WAYBACK_MACHINE,
);
export const PROVIDER_NEWS_MEDIA_CLOUD_LEGACY = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_MEDIA_CLOUD_LEGACY,
);

export const PROVIDER_NEWS_MEDIA_CLOUD = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_MEDIA_CLOUD,
);

export const PROVIDER_REDDIT_PUSHSHIFT = providerName(PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT);

export const PROVIDER_YOUTUBE_YOUTUBE = providerName(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE);

// the latest allowed end date for the type of platform
export const latestAllowedEndDate = (provider) => {
  const today = dayjs();
  if (provider === PROVIDER_NEWS_WAYBACK_MACHINE) return today.subtract('4', 'day');
  if (provider === PROVIDER_NEWS_MEDIA_CLOUD || provider === PROVIDER_NEWS_MEDIA_CLOUD_LEGACY) return today.subtract('1', 'day');
  return today;
};

// the earliest starting date for the type of platform
export const earliestAllowedStartDate = (provider) => {
  if (provider === PROVIDER_NEWS_WAYBACK_MACHINE) return dayjs('2022-08-01');
  if (provider === PROVIDER_REDDIT_PUSHSHIFT) return dayjs('2022-11-1');
  return dayjs('2010-01-01');
};

export const defaultPlatformProvider = (platform) => {
  if (platform === PLATFORM_TWITTER) return PROVIDER_TWITTER_TWITTER;
  if (platform === PLATFORM_REDDIT) return PROVIDER_REDDIT_PUSHSHIFT;
  if (platform === PLATFORM_YOUTUBE) return PROVIDER_YOUTUBE_YOUTUBE;
  if (platform === 'online_news') return PROVIDER_NEWS_MEDIA_CLOUD;
  return null;
};

export const defaultPlatformQuery = (platform) => {
  if (platform === 'online_news') return ['*'];
  if (platform === PLATFORM_REDDIT) return ['*'];
  // can't search everything on these, so try a smiley!
  if (platform === PLATFORM_TWITTER) return ['🙂'];
  if (platform === PLATFORM_YOUTUBE) return ['🙂'];
  return null;
};
