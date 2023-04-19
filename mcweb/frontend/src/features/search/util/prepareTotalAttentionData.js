import queryTitle from './queryTitle';

// using EPSILON in the denominator here prevents against div by zero errors
// (which returns infinity in JS)
const normalizeData = (relevant, total) => 100 * (relevant
    / (total + Number.EPSILON));

const colors = ['#2f2d2b', '#d24527', '#f7a44e', '#334cda', '#d23716'];

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
