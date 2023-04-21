import queryGenerator from './queryGenerator';

const fullQuery = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  let queryReturn = '';
  if (queryString) {
    queryReturn = queryString;
  } else {
    queryReturn = queryGenerator(queryList, negatedQueryList, platform, anyAll);
  }
  return queryReturn;
};

const queryTitle = (queryState, queryIndex) => {
  const {
    queryList,
    queryString,
    negatedQueryList,
    platform,
    anyAll,
  } = queryState[queryIndex];

  return fullQuery(queryList, negatedQueryList, platform, anyAll, queryString);
};

export default queryTitle;
