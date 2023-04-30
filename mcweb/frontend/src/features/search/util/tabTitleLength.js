import queryTitle from './queryTitle';

const tabTitleLength = (queryState, queryIndex) => {
  const title = queryTitle(queryState, queryIndex);

  return title.length > 35;
};

export default tabTitleLength;
