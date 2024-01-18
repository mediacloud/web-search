import queryGenerator from '../queryGenerator';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  // advanced mode
  if (queryString) {
    return queryString.length <= 50 ? queryString : `${queryString.slice(0, 50)}...`;
  }

  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

export default createTitle;
