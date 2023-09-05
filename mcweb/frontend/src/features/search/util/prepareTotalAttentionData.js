// using EPSILON in the denominator here prevents against div by zero errors
// (which returns infinity in JS)
const normalizeData = (relevant, total) => 100 * (relevant
  / (total + Number.EPSILON));

const colors = ['#2f2d2b', '#d24527', '#f7a44e', '#334cda', '#d23716'];

const prepareTotalAttentionData = (results, normalized) => {
  const series = [];
  // const { relevant, total } = results.data.count;
  results.forEach((result, i) => {
    const { relevant, total } = result.count;
    console.log('REL', relevant, total);
    const prepareData = {};
    prepareData.key = 'Matching Content';
    prepareData.value = normalized ? normalizeData(relevant, total) : relevant;
    series.push(
      {
        data: [prepareData],
        color: colors[i],
      },
    );
  });
  return series;
};

export default prepareTotalAttentionData;
