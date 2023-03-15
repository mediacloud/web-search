import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import queryGenerator from './queryGenerator';

const dateHelper = (dateString) => {
  dayjs.extend(utc);
  const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
  return newDate;
};

const fullQuery = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  let queryReturn = '';
  if (queryString) {
    queryReturn = queryString;
  } else {
    queryReturn = queryGenerator(queryList, negatedQueryList, platform, anyAll);
  }
  return queryReturn;
};

const queryTitle = (queryState, queryIndex) => {
  const {
    queryList,
    queryString,
    negatedQueryList,
    platform,
    anyAll,
  } = queryState[queryIndex];

  return fullQuery(queryList, negatedQueryList, platform, anyAll, queryString);
};

const cleanCountOverTimeData = (results, normalized, queryState) => {
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

export default cleanCountOverTimeData;
