import queryTitle from './queryTitle';
import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';

const tabTitle = (queryState, queryIndex) => {
  const query = queryState.map((item) => ({
    ...item,
    platform: PROVIDER_NEWS_MEDIA_CLOUD,
  }));

  const title = queryTitle(query, queryIndex);

  if (title === '*') {
    return `Query ${queryIndex + 1}`;
  } if (title.length > 35) {
    return `${title.substring(0, 35)} ...`;
  }
  return title;
};

export default tabTitle;
