// using EPSILON in the denominator here prevents against div by zero errors
// (which returns infinity in JS)
const normalizeData = (relevant, total) => 100 * (relevant
  / (total + Number.EPSILON));

const colors = ['#2f2d2b', '#d24527', '#f7a44e', '#334cda', '#d23716', '#7c5b8e', '#f1b52a', '#48a37e', '#c6278e', '#378fd2'];

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
        color: colors[i],
      },
    );
  });
  return series;
};

export default prepareTotalAttentionData;
