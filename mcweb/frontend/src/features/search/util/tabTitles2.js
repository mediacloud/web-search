import queryTitle2 from './queryTitle2';
import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';

const tabTitle2 = (queryList, negatedQueryList, anyAll, queryString, index) => {
  const queryState = {
    queryList,
    negatedQueryList,
    anyAll,
    queryString,
    platform: PROVIDER_NEWS_MEDIA_CLOUD,
  };
  const title = queryTitle2(queryState, index);

  if (title === '*') {
    return `Query ${index + 1}`;
  } if (title.length > 30) {
    return `${title.substring(0, 30)} ...`;
  }
  return title;
};

export default tabTitle2;
