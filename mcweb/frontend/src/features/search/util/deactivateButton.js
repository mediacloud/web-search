import dayjs from 'dayjs';

const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(isSameOrBefore);

const deactvateButton = (queryState) => {
  let returnVal = true;
  queryState.forEach((queryObject) => {
    const {
      queryString,
      queryList,
      negatedQueryList,
      startDate,
      endDate,
    } = queryObject;

    const totalQuery = queryList.concat(negatedQueryList);

    // checks too see if the query is empty
    function validQuery(tQ) {
      for (let i = 0; i < tQ.length; i += 1) {
        if (tQ[i].length > 0) {
          return true;
        }
      }
      return false;
    }

    // checks to see if the startDAte is before the endDAte
    function validDates(sD, eD) {
      return dayjs(sD).isSameOrBefore(dayjs(eD));
    }

    // is the advanced search query string not just the "*"
    function validQueryString(qS) {
      return qS.length !== 0;
    }

    // is the query string empty?
    const isQueryEmpty = validQuery(totalQuery);

    // are the dates in correct order?
    const areDatesValid = validDates(startDate, endDate);

    // is the advanced search query empty?
    const isQueryStringEmpty = validQueryString(queryString);

    returnVal = ((isQueryEmpty || isQueryStringEmpty) && areDatesValid);
  });
  return returnVal;
};

export default deactvateButton;
