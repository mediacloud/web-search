import dayjs from 'dayjs';

const validateDate = (currentDate, minDate, maxDate) => {
  // just in case, make sure dates are dayjs, then convert
  // to Unix timestamp (int seconds since 1970-01-01)
  const curr = dayjs(currentDate).unix();
  const min = dayjs(minDate).unix();
  const max = dayjs(maxDate).unix();

  return curr >= min && curr <= max;
};

export default validateDate;
