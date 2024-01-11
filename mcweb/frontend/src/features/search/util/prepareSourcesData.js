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
        data: queryData.sources.slice(0, 10).map((s) => ({
          key: `<a 
          href="https://${s.source}" target="_blank" rel="noreferrer">${s.source}</a>`,
          value: normalized ? (s.count / totalCount) * 100 : s.count,
        })),
        name: 'Source',
        color: colorArray[i],
      },
    );
  });
  return series;
}
