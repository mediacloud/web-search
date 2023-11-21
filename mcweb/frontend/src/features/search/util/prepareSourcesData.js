const colorArray = ['#2f2d2b', '#d24527', '#2f2d2b', '#d23716', '#f7a44e'];

const getTotalDomainCount = (queryData) => {
  let totalCount = 0;
  queryData.sources.forEach((d) => {
    totalCount += d.count;
  });
  return totalCount;
};

export default function prepareSourceData(domainData, normalized) {
  const series = [];

  domainData.forEach((queryData, i) => {
    const totalCount = getTotalDomainCount(queryData);
    series.push(
      {
        data: queryData.sources.map((s) => ({
          key: s.source, value: normalized ? (s.count / totalCount) * 100 : s.count,
        })),
        name: 'Domain',
        color: colorArray[i],
      },
    );
  });
  return series;
}
