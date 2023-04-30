import queryTitle from './queryTitle';
import tabTitleLength from './tabTitleLength';

const tabTitle = (queryState, queryIndex) => {
  const title = queryTitle(queryState, queryIndex);

  if (title === '*') {
    return `Query ${queryIndex + 1}`;
  } if (tabTitleLength(queryState, queryIndex)) {
    return `${title.substring(0, 35)} ...`;
  }
  return title;
};

export default tabTitle;
