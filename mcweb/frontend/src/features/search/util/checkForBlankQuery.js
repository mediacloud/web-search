/* eslint-disable consistent-return */
import isQueryListBlank from './isQueryListBlank';

const checkForBlankQuery = (queryState) => {
  let isBlank = false;
  queryState.forEach(
    ({
      queryList, negatedQueryList, advanced, queryString,
    }) => {
      if ((isQueryListBlank(queryList) && isQueryListBlank(negatedQueryList)) || (advanced && queryString.trim() !== '')) {
        isBlank = true;
        return true; // exit the loop early
      }
    },
  );
  return isBlank;
};

export default checkForBlankQuery;
