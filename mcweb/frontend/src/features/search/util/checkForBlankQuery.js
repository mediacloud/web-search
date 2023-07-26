/* eslint-disable consistent-return */
import isQueryListBlank from './isQueryListBlank';

const checkForBlankQuery = (queryState) => {
  let isBlank = false;
  queryState.forEach(
    ({
      queryList, negatedQueryList, advanced, queryString,
    }) => {
      if ((isQueryListBlank(queryList) && isQueryListBlank(negatedQueryList))) {
        isBlank = true;
      } else if (!isQueryListBlank(queryList)) {
        isBlank = false;
      }
      if (advanced && queryString.trim() === '') {
        isBlank = true;
      } else if (advanced && queryString.trim() !== '') {
        isBlank = false;
      }
    },
  );
  return isBlank;
};

export default checkForBlankQuery;
