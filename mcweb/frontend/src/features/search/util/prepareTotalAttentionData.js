import queryGenerator from './queryGenerator';

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

// using EPSILON in the denominator here prevents against div by zero errors
// (which returns infinity in JS)
const normalizeData = (relevant, total) => 100 * (relevant
    / (total + Number.EPSILON));

const colors = ['#2f2d2b', '#d24527', '#2f2d2b', '#d23716', '#f7a44e'];

const prepareTotalAttentionData = (results, queryState, normalized) => {
  const series = [];
  const { relevant, total } = results.count;
  debugger;
  relevant.forEach((result, i) => {
    const data = {};
    data.key = queryTitle(queryState, i);
    data.value = normalized ? normalizeData(relevant[i], total[i]) : result.count.relevant[i];
    series.push({ data, name: 'Matching Content', color: colors[i] });
  });
};

// series={[{
//     data: [{ key: fullQuery, value: (normalized) ? normalizeData(data) : data.count.relevant }],
//     name: 'Matching Content',
//     color: '#2f2d2b',
//   }]}

export default prepareTotalAttentionData;
