import dayjs from 'dayjs';
// keep in sync with mcweb/frontend/views.py
export const PLATFORM_ONLINE_NEWS = 'onlinenews';

export const PLATFORM_SOURCE_WAYBACK_MACHINE = 'waybackmachine';
export const PLATFORM_SOURCE_MEDIA_CLOUD = 'mediacloud';

const providerName = (platform, source) => `${platform}-${source}`;

// synthetic constants to make life easier here
export const PROVIDER_NEWS_WAYBACK_MACHINE = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_WAYBACK_MACHINE,
);

export const PROVIDER_NEWS_MEDIA_CLOUD = providerName(
  PLATFORM_ONLINE_NEWS,
  PLATFORM_SOURCE_MEDIA_CLOUD,
);

const { earliestAvailableDate } = document.settings; // MC earliest date

// the latest allowed end date for the type of platform as dayjs
export const latestAllowedEndDate = (provider) => {
  const today = dayjs();
  if (provider === PROVIDER_NEWS_WAYBACK_MACHINE) return today.subtract('4', 'day');
  // allowing today for PROVIDER_NEWS_MEDIA_CLOUD
  return today;
};

// the earliest starting date for the type of platform as dayjs
export const earliestAllowedStartDate = (provider) => {
  if (provider === PROVIDER_NEWS_WAYBACK_MACHINE) return dayjs('2022-08-01');
  return dayjs(earliestAvailableDate);
};

export const defaultPlatformProvider = (platform) => {
  if (platform === 'online_news') return PROVIDER_NEWS_MEDIA_CLOUD;
  return null;
};

export const defaultPlatformQuery = (platform) => {
  if (platform === 'online_news') return ['*'];
  return null;
};
