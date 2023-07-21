import dayjs from 'dayjs';
import checkForBlankQuery from './checkForBlankQuery';

const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(isSameOrBefore);

const deactvateButton = (queryState) => {
  let returnVal = true;

  queryState.forEach((queryObject) => {
    const {
      startDate,
      endDate,
      isFromDateValid,
      isToDateValid,
    } = queryObject;

    // parameters are both boolean variables
    function validFromAndToDates(validatedFromDate, validatedToDate) {
      return validatedFromDate && validatedToDate;
    }

    // checks to see if the startDAte is before the endDAte
    function validDates(startingDate, endingDate) {
      return dayjs(startingDate).isSameOrBefore(dayjs(endingDate));
    }

    // are the dates in correct order and validated?
    const areDatesValid = validDates(startDate, endDate) && validFromAndToDates(isFromDateValid, isToDateValid);

    returnVal = (!checkForBlankQuery(queryState) && areDatesValid);
  });
  return returnVal;
};

export default deactvateButton;
