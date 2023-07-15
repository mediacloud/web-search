import dayjs from 'dayjs';
import isQueryListBlank from './isQueryListBlank';

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
      isFromDateValid,
      isToDateValid,
      advanced,
    } = queryObject;

    const totalQuery = queryList.concat(negatedQueryList);

    // parameters are both boolean variables
    function validFromAndToDates(validatedFromDate, validatedToDate) {
      return validatedFromDate && validatedToDate;
    }

    // checks to see if the startDate is before the endDAte
    function validDates(startingDate, endingDate) {
      return dayjs(startingDate).isSameOrBefore(dayjs(endingDate));
    }

    // is the advanced search query string not just the "*"
    function validQueryString() {
      return advanced && queryString.trim() !== '';
    }

    // does the queryList contain any elements?
    const isQueryValid = !isQueryListBlank(totalQuery);

    // are the dates in correct order and validated?
    const areDatesValid = validDates(startDate, endDate) && validFromAndToDates(isFromDateValid, isToDateValid);

    // is the advanced search query not empty?
    const isQueryStringValid = validQueryString(queryString, advanced);

    returnVal = ((isQueryValid || isQueryStringValid) && areDatesValid);
  });
  return returnVal;
};

export default deactvateButton;
