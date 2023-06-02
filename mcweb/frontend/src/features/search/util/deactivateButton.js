import dayjs from 'dayjs';

const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(isSameOrBefore);

const deactvateButton = (queryState) => {
  let returnVal = true;

  // console.log(queryState);

  queryState.forEach((queryObject) => {
    const {
      queryString,
      queryList,
      negatedQueryList,
      startDate,
      endDate,
      isFromDateValid,
      isToDateValid,
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

    function validFromAndToDates(validatedFromDate, validatedToDate) {
      return validatedFromDate && validatedToDate;
    }

    // checks to see if the startDAte is before the endDAte
    function validDates(startingDate, endingDate) {
      return dayjs(startingDate).isSameOrBefore(dayjs(endingDate));
    }

    // is the advanced search query string not just the "*"
    function validQueryString(queryStr) {
      return queryString.length !== 0;
    }

    // is the query string empty?
    const isQueryEmpty = validQuery(totalQuery);

    // are the dates in correct order and validated?
    const areDatesValid = validDates(startDate, endDate) && validFromAndToDates(isFromDateValid, isToDateValid);

    // is the advanced search query empty?
    const isQueryStringEmpty = validQueryString(queryString);

    returnVal = ((isQueryEmpty || isQueryStringEmpty) && areDatesValid);
  });
  return returnVal;
};

export default deactvateButton;
