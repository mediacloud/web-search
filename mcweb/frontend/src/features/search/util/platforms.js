import dayjs from 'dayjs';

// keep in sync with mcweb/frontend/views.py

export const PLATFORM_TWITTER = 'twitter';
export const PLATFORM_REDDIT = 'reddit';
export const PLATFORM_YOUTUBE = 'youtube';
export const PLATFORM_ONLINE_NEWS = 'onlinenews';

export const PLATFORM_SOURCE_PUSHSHIFT = 'pushshift';
export const PLATFORM_SOURCE_TWITTER = 'twitter';
export const PLATFORM_SOURCE_YOUTUBE = 'youtube';
export const PLATFORM_SOURCE_MEDIA_CLOUD = 'mediacloud';
export const PLATFORM_SOURCE_WAYBACK_MACHINE = 'waybackmachine';

const providerName = (platform, source) => `${platform}-${source}`;

// synthetic constants to make life easier here
export const PROVIDER_TWITTER_TWITTER = providerName(PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER);
export const PROVIDER_NEWS_MEDIA_CLOUD = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_MEDIA_CLOUD,
);
export const PROVIDER_NEWS_WAYBACK_MACHINE = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_WAYBACK_MACHINE,
);
export const PROVIDER_REDDIT_PUSHSHIFT = providerName(PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT);
export const PROVIDER_YOUTUBE_YOUTUBE = providerName(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE);

export const latestAllowedEndDate = (provider) => {
  const today = dayjs();
  if (provider === PROVIDER_NEWS_MEDIA_CLOUD) return today.subtract('1', 'day');
  if (provider === PROVIDER_NEWS_WAYBACK_MACHINE) return today.subtract('4', 'day');
  return today;
};
