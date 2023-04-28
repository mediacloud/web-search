import dayjs from 'dayjs';

const validateDate = (currentDate, minDate, maxDate) => {
  const daysBetweenMinAndtoDate = dayjs(currentDate).diff(dayjs(minDate), 'day');

  const daysBetweenToDateAndMax = dayjs(maxDate).diff(dayjs(currentDate), 'day');

  const daysBetweenMinAndMax = dayjs(maxDate).diff(dayjs(minDate), 'day');

  const currentYear = dayjs(currentDate).year();
  const minYear = dayjs(minDate).year();
  const maxYear = dayjs(maxDate).year();

  const isCurrentYearInBetweenMinAndMax = currentYear >= minYear && currentYear <= maxYear;

  const isCurrentDateInBetween = daysBetweenMinAndtoDate <= daysBetweenMinAndMax
    && daysBetweenToDateAndMax <= daysBetweenMinAndMax;

  return isCurrentYearInBetweenMinAndMax && isCurrentDateInBetween;
};

export default validateDate;
