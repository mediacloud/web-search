import { PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD} from './platforms';

const queryGenerator = (queryList, negatedQueryList, platform, anyAll) => {
  let fullQuery = '';
  if (!queryList && !negatedQueryList) return null;

  const deQuoter = (w) => (w.replaceAll('"', ''));
  const quoter = (w) => (w.includes(' ') ? `"${w}"` : w); // add quotes if there is a space in string

  const query = queryList ? queryList.filter((queryWord) => queryWord.length >= 1).map((term) => {
    const trimmed = term.trim();
    const deQuoted = deQuoter(trimmed);
    return quoter(deQuoted);
  }) : [];

  const negatedQuery = negatedQueryList ? negatedQueryList.filter(
    (queryWord) => queryWord.length >= 1,
  ).map((term) => {
    const trimmed = term.trim();
    const deQuoted = deQuoter(trimmed);
    return quoter(deQuoted);
  }) : [];

  // first add in the match list
  if ((platform === PROVIDER_NEWS_MEDIA_CLOUD) || (platform === PROVIDER_NEWS_WAYBACK_MACHINE)) {
    if (anyAll === 'any') {
      fullQuery = (query.length === 0) ? '*' : `${query.join(' OR ')}`;
    } else {
      fullQuery = (query.length === 0) ? '*' : `${query.join(' AND ')}`;
    }
  }  
  // now add negations, if any
  if (negatedQuery.length > 0) {
    if (platform === PROVIDER_NEWS_WAYBACK_MACHINE) {
      fullQuery = `(${fullQuery}) -(${negatedQuery.join(' -')})`;
    } else if (platform === PROVIDER_NEWS_MEDIA_CLOUD) {
      fullQuery = `(${fullQuery}) -(${negatedQuery.join(' OR ')})`;
    } 
  }
  return fullQuery; // returning full combined matches plus negations
};

export default queryGenerator;
