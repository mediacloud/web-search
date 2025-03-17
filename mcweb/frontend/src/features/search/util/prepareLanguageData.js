import getColors from './getColors';

export default function prepareLanguageData(languageData, queryState) {
  if (!languageData || languageData.length === 0) return null;
  const series = [];
  const colors = getColors(queryState);
  languageData.forEach((queryData, i) => {
    const tempSeries = [];
    queryData.languages.forEach((l) => {
      if (l.ratio >= 0.01) {
        tempSeries.push(
          { key: l.language, value: l.ratio * 100 },
        );
      }
    });
    series.push({
      data: tempSeries,
      name: 'Language',
      color: colors[i],
    });
  });
  return series;
}

// series requirements for word cloud
// series={[{
//   data: data.languages.map((l) => ({
//     key: l.language, value: l.ratio * 100,
//   })),
//   name: 'Language',
//   color: '#2f2d2b',
// }]}
