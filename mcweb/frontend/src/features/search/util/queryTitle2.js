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

const queryTitle2 = (queryState) => {
  const {
    queryList,
    queryString,
    negatedQueryList,
    platform,
    anyAll,
  } = queryState;

  return fullQuery(queryList, negatedQueryList, platform, anyAll, queryString);
};

export default queryTitle2;
