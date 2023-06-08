import queryGenerator from './queryGenerator';

export default function prepareQueries(queryState) {
  const queryArray = queryState.map((singleQuery) => {
    const {
      queryList,
      queryString,
      negatedQueryList,
      platform,
      startDate,
      endDate,
      collections,
      sources,
      anyAll,
    } = singleQuery;

    const fullQuery = () => {
      let queryReturn = '';
      if (queryString.length !== 0) {
        queryReturn = queryString;
      } else {
        queryReturn = queryGenerator(queryList, negatedQueryList, platform, anyAll);
      }
      return queryReturn;
    };

    return {
      query: fullQuery(),
      startDate,
      endDate,
      collections,
      sources,
      platform,
    };
  });

  return queryArray;
}
