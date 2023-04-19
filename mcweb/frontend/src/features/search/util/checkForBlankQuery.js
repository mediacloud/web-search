const checkForBlankQuery = (queryState) => {
  let blank = false;

  queryState.forEach((querySlice) => {
    const { queryList, advanced, queryString } = querySlice;
    if (queryList[0].length !== 0 || (advanced && queryString !== 0)) {
      blank = true;
    } else {
      blank = false;
    }
  });

  return blank;
};

export default checkForBlankQuery;
