const colorArray = ['#2f2d2b', '#d24527', '#2f2d2b', '#d23716', '#f7a44e'];

export default function prepareLanguageData(languageData) {
  const series = [];
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
      color: colorArray[i],
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
