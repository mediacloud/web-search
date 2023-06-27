import queryGenerator from './queryGenerator';

const fullQuery = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  let queryReturn = '';
  if (queryString) {
    queryReturn = queryString;
  } else {
    console.log(`negatedQueryList: ${negatedQueryList}`);
    queryReturn = queryGenerator(queryList, negatedQueryList, platform, anyAll);
  }
  return queryReturn;
};

const queryTitle = (queryState) => {
  const {
    queryList,
    queryString,
    negatedQueryList,
    platform,
    anyAll,
  } = queryState;

  return fullQuery(queryList, negatedQueryList, platform, anyAll, queryString);
};

export default queryTitle;
