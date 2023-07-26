import queryGenerator from '../queryGenerator';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  // advanced mode
  if (queryString) return queryString;

  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

export default createTitle;
