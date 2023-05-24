import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

const dateHelper = (dateString) => {
  dayjs.extend(utc);
  const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
  return newDate;
};

const prepareCountOverTimeData = (results, normalized) => {
  const series = [];

  results.forEach((result, i) => {
    const data = result.counts.map((r) => [
      dateHelper(r.date),
      normalized ? r.ratio * 100 : r.count,
    ]);
    series.push({
      data,
    });
  });
  return series;
};

export default prepareCountOverTimeData;
