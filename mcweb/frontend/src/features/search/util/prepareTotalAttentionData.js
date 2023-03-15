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
  relevant.forEach((result, i) => {
    const prepareData = {};
    const name = queryTitle(queryState, i);
    prepareData.key = 'Matching Content';
    prepareData.value = normalized ? normalizeData(relevant[i], total[i]) : relevant[i];
    series.push({ data: [prepareData], name, color: colors[i] });
  });
  return series;
};

export default prepareTotalAttentionData;
