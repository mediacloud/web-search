import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_TWITTER_TWITTER,
  PROVIDER_YOUTUBE_YOUTUBE, PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_NEWS_MEDIA_CLOUD,
} from './platforms';

const queryGenerator = (queryList, negatedQueryList, platform, anyAll) => {
  let fullQuery = '';
  if (!queryList && !negatedQueryList) return null;

  const quoter = (w) => (w.includes(' ') ? `"${w}"` : w); // add quotes if there is a space in string

  const query = queryList ? queryList.filter((queryWord) => queryWord.length >= 1).map(quoter) : [];

  const negatedQuery = negatedQueryList ? negatedQueryList.filter(
    (queryWord) => queryWord.length >= 1,
  ).map(quoter) : [[]];

  // first add in the match list
  if ((platform === PROVIDER_NEWS_MEDIA_CLOUD) || (platform === PROVIDER_NEWS_WAYBACK_MACHINE)) {
    if (anyAll === 'any') {
      fullQuery = (query.length === 0) ? '*' : `${query.join(' OR ')}`;
    } else {
      fullQuery = (query.length === 0) ? '*' : `${query.join(' AND ')}`;
    }
  } else if (platform === PROVIDER_REDDIT_PUSHSHIFT) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' | ')}`;
    } else {
      fullQuery = `${query.join(' + ')}`;
    }
  } else if (platform === PROVIDER_YOUTUBE_YOUTUBE) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' | ')}`;
    } else {
      fullQuery = `${query.join(' ')}`;
    }
  } else if (platform === PROVIDER_TWITTER_TWITTER) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' OR ')}`;
    } else {
      fullQuery = `${query.join(' ')}`;
    }
  }
  // now add negations, if any
  if (negatedQuery.length > 0) {
    console.log(negatedQuery);
    if (platform === PROVIDER_NEWS_MEDIA_CLOUD) {
      fullQuery = `(${fullQuery}) AND NOT (${negatedQuery.join(' OR ')})`;
    } else if (platform === PROVIDER_NEWS_WAYBACK_MACHINE) {
      fullQuery = `(${fullQuery}) -(${negatedQuery.join(' -')})`;
    } else if (platform === PROVIDER_REDDIT_PUSHSHIFT) {
      fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
    } else if (platform === PROVIDER_YOUTUBE_YOUTUBE) {
      fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
    } else if (platform === PROVIDER_TWITTER_TWITTER) {
      fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
    }
  }
  return fullQuery; // returning full combined matches plus negations
};

export default queryGenerator;
