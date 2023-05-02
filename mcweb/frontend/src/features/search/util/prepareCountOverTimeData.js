import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import queryTitle from './queryTitle';

const dateHelper = (dateString) => {
  dayjs.extend(utc);
  const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
  return newDate;
};

const prepareCountOverTimeData = (results, normalized, queryState) => {
  const series = [];

  results.forEach((result, i) => {
    const data = result.counts.map((r) => [
      dateHelper(r.date),
      normalized ? r.ratio * 100 : r.count,
    ]);
    series.push({
      name: `query: ${queryTitle(queryState, i)} `,
      data,
      colorIndex: i,
    });
  });
  return series;
};

export default prepareCountOverTimeData;
