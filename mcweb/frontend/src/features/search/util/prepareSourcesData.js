import getColors from './getColors';

const getTotalDomainCount = (queryData) => {
  let totalCount = 0;
  queryData.sources.forEach((d) => {
    totalCount += d.count;
  });
  return totalCount;
};

export default function prepareSourceData(domainData, normalized, queryState) {
  if (!domainData || domainData.length === 0) return null;
  const series = [];
  const colors = getColors(queryState);
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
        color: colors[i],
      },
    );
  });
  return series;
}
