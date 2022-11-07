import {
  PLATFORM_REDDIT, PLATFORM_ONLINE_NEWS, PLATFORM_TWITTER, PLATFORM_YOUTUBE,
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
    if (platform === PLATFORM_ONLINE_NEWS) {
      if (anyAll === 'any') {
        fullQuery = `${query.join(' OR ')}`;
      } else {
        fullQuery = `${query.join(' AND ')}`;
      }
    } else if (platform === PLATFORM_REDDIT) {
      if (anyAll === 'any') {
        fullQuery = `${query.join(' | ')}`;
      } else {
        fullQuery = `${query.join(' + ')}`;
      }
    } else if (platform === PLATFORM_YOUTUBE) {
      if (anyAll === 'any') {
        fullQuery = `${query.join(' | ')}`;
      } else {
        fullQuery = `${query.join(' ')}`;
      }
    } else if (platform === PLATFORM_TWITTER) {
      if (anyAll === 'any') {
        fullQuery = `${query.join(' OR ')}`;
      } else {
        fullQuery = `${query.join(' ')}`;
      }
    }
  } else if (platform === PLATFORM_ONLINE_NEWS) {
    const combinator = (anyAll === 'any') ? ' OR ' : ' AND ';
    const matchTerms = query.length > 0 ? `(${query.join(combinator)})` : '*';
    fullQuery = `${matchTerms} AND NOT (${negatedQuery.join(' OR ')})`;
  } else if (platform === PLATFORM_REDDIT) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' | ')}`;
    } else {
      fullQuery = `${query.join(' + ')}`;
    }
    fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
  } else if (platform === PLATFORM_YOUTUBE) {
    if (anyAll === 'any') {
      fullQuery = `${query.join(' | ')}`;
    } else {
      fullQuery = `${query.join(' ')}`;
    }
    fullQuery = `(${fullQuery}) -${negatedQuery.join(' -')}`;
  } else if (platform === PLATFORM_TWITTER) {
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
