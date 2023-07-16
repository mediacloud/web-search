/* eslint-disable consistent-return */
import isQueryListBlank from './isQueryListBlank';

const checkForBlankQuery = (queryState) => {
  let isBlank = true;
  queryState.forEach(
    ({
      queryList, negatedQueryList, advanced, queryString,
    }) => {
      if (!isQueryListBlank(queryList) || !isQueryListBlank(negatedQueryList) || (advanced && queryString.trim() !== '')) {
        isBlank = false;
        return false; // exit the loop early
      }
    },
  );
  return isBlank;
};

export default checkForBlankQuery;
