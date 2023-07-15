const checkForBlankQuery = (queryState) => {
  queryState.forEach((query) => {
    const { queryList, advanced, queryString } = query;
    if (queryList[0].length !== 0 || (advanced && queryString !== 0)) {
      return true;
    }
  });
  return false;
};

export default checkForBlankQuery;
