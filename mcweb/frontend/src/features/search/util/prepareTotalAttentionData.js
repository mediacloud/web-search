// using EPSILON in the denominator here prevents against div by zero errors
// (which returns infinity in JS)
const normalizeData = (relevant, total) => 100 * (relevant
  / (total + Number.EPSILON));

const prepareTotalAttentionData = (results, normalized) => {
  const series = [];
  const { relevant, total } = results.count;
  relevant.forEach((result, i) => {
    const prepareData = {};
    prepareData.key = 'Matching Content';
    prepareData.value = normalized ? normalizeData(relevant[i], total[i]) : relevant[i];
    series.push(
      {
        data: [prepareData],
      },
    );
  });
  return series;
};

export default prepareTotalAttentionData;
