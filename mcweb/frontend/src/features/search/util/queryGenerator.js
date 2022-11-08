import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_TWITTER_TWITTER,
  PROVIDER_YOUTUBE_YOUTUBE, PROVIDER_NEWS_WAYBACK_MACHINE,
} from './platforms';

const queryGenerator = (queryList, negatedQueryList, platform, anyAll) => {
  let fullQuery = '';
  if (!queryList && !negatedQueryList) return null;

  const quoter = (w) => (w.includes(' ') ? `"${w}"` : w); // add quotes if there is a space in string

  const query = queryList ? queryList.filter((queryWord) => queryWord.length >= 1).map(quoter) : [];

  const negatedQuery = negatedQueryList ? negatedQueryList.filter(
    (queryWord) => queryWord.length >= 1,
  ).map(quoter) : [[]];

  if (negatedQueryList[0].length === 0) {
    if ((platform === PROVIDER_NEWS_MEDIA_CLOUD) || (platform === PROVIDER_NEWS_WAYBACK_MACHINE)) {
      if (anyAll === 'any') {
        fullQuery = `${query.join(' OR ')}`;
      } else {
        fullQuery = `${query.join(' AND ')}`;
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
  } else if ((platform === PROVIDER_NEWS_MEDIA_CLOUD)
  || (platform === PROVIDER_NEWS_WAYBACK_MACHINE)) {
    const combinator = (anyAll === 'any') ? ' OR ' : ' AND ';
    const matchTerms = query.length > 0 ? `(${query.join(combinator)})` : '*';
    fullQuery = `${matchTerms} AND NOT (${negatedQuery.join(' OR ')})`;
  } else if (platform === PROVIDER_REDDIT_PUSHSHIFT) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' | ')}`;
    } else {
      fullQuery = `${query.join(' + ')}`;
    }
    fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
  } else if (platform === PROVIDER_YOUTUBE_YOUTUBE) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' | ')}`;
    } else {
      fullQuery = `${query.join(' ')}`;
    }
    fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
  } else if (platform === PROVIDER_TWITTER_TWITTER) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' OR ')}`;
    } else {
      fullQuery = `${query.join(' ')}`;
    }
    fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
  }
  return fullQuery;
};

export default queryGenerator;
