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
      if (queryString) {
        queryReturn = queryString;
      } else {
        queryReturn = queryGenerator(queryList, negatedQueryList, platform, anyAll);
      }
      return queryReturn;
    };

    const collectionIds = collections.map((c) => c.id);
    const sourceIds = sources.map((s) => s.id);

    return {

      query: fullQuery(),
      startDate,
      endDate,
      collections: collectionIds,
      sources: sourceIds,
      platform,
    };
  });

  return queryArray;
}
