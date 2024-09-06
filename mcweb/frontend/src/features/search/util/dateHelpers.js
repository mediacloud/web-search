import dayjs from 'dayjs';

const getEarliestAvailableDate = (earliestAvailableDate) => {
  const earliestDateObj = dayjs.unix(earliestAvailableDate);
  return earliestDateObj.format('MM/DD/YYYY');
};

export default getEarliestAvailableDate;
