import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

const dateHelper = (dateString) => {
  dayjs.extend(utc);
  const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
  return newDate;
};

const colors = ['#2f2d2b', '#d24527', '#f7a44e', '#334cda', '#d23716', '#7c5b8e', '#f1b52a', '#48a37e', '#c6278e', '#378fd2'];

const prepareCountOverTimeData = (results, normalized) => {
  const series = [];

  results.forEach((result, i) => {
    const data = result.counts.map((r) => [
      dateHelper(r.date),
      normalized ? r.ratio * 100 : r.count,
    ]);
    series.push({
      data,
      color: colors[i],
    });
  });
  return series;
};

export default prepareCountOverTimeData;
