import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import getColors from './getColors';

export const DAY = 'day';
export const WEEK = 'week';
export const MONTH = 'month';

// const colors = ['#2f2d2b', '#d24527', '#f7a44e', '#334cda', '#d23716'];

const dateHelper = (dateString) => {
  dayjs.extend(utc);
  const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
  return newDate;
};

// date grouping with help from https://stackoverflow.com/questions/35441820/tomorrow-today-and-yesterday-with-momentjs
function groupValues(elements, duration, normalized) {
  const formatted = elements.count_over_time.counts.map((elem) => ({
    date: dayjs(elem.date).startOf(duration).format('YYYY-MM-DD'),
    count: elem.count,
    total_count: elem.total_count,
  }));

  const dates = formatted.map((elem) => elem.date);

  const uniqueDates = dates.filter((date, index) => dates.indexOf(date) === index);

  const returnData = uniqueDates.map((date) => {
    // const count = formatted.filter((elem) => elem.date === date).reduce((count, elem) => count + elem.count, 0);
    const filtered = formatted.filter((elem) => elem.date === date);
    const count = filtered.reduce((redCount, elem) => redCount + elem.count, 0);
    const totalCount = filtered.reduce((redCount, elem) => redCount + elem.total_count, 0);
    const ratio = (count / totalCount);
    return [dateHelper(date), normalized ? (ratio * 100) : count];
  });

  return returnData;
}

export const prepareCountOverTimeData = (results, normalized, chartBy, queryState) => {
  if (!results || results.length === 0) return null;
  const series = [];
  const colors = getColors(queryState);
  if (chartBy === DAY) {
    results.forEach((result, i) => {
      const preparedData = result.count_over_time.counts.map((r) => [
        dateHelper(r.date),
        normalized ? r.ratio * 100 : r.count,
      ]);
      series.push({
        data: preparedData,
        color: colors[i],
      });
    });
  } else if (chartBy === WEEK) {
    results.forEach((result, i) => {
      const groupedData = groupValues(result, WEEK, normalized);
      series.push({
        data: groupedData,
        color: colors[i],
      });
    });
  } else {
    results.forEach((result, i) => {
      const groupedData = groupValues(result, MONTH, normalized);
      series.push({
        data: groupedData,
        color: colors[i],
      });
    });
  }
  return series;
};

// RESULTS
// [
//   {
//       "count_over_time": {
//           "counts": [
//               {
//                   "date": "2023-12-13 00:00:00",
//                   "total_count": 8695,
//                   "count": 313,
//                   "ratio": 0.03599769982748706
//               },
//               {
//                   "date": "2023-12-14 00:00:00",
//                   "total_count": 8953,
//                   "count": 291,
//                   "ratio": 0.032503071596113035
//               },
//               {
//                   "date": "2023-12-15 00:00:00",
//                   "total_count": 8096,
//                   "count": 353,
//                   "ratio": 0.04360177865612648
//               },
//               {
//                   "date": "2023-12-16 00:00:00",
//                   "total_count": 4106,
//                   "count": 203,
//                   "ratio": 0.04943984413054067
//               },
//               {
//                   "date": "2023-12-17 00:00:00",
//                   "total_count": 4374,
//                   "count": 208,
//                   "ratio": 0.04755372656607224
//               },
//               {
//                   "date": "2023-12-18 00:00:00",
//                   "total_count": 7947,
//                   "count": 398,
//                   "ratio": 0.05008179187114634
//               },
//               {
//                   "date": "2023-12-19 00:00:00",
//                   "total_count": 8360,
//                   "count": 365,
//                   "ratio": 0.04366028708133971
//               },
//               {
//                   "date": "2023-12-20 00:00:00",
//                   "total_count": 8645,
//                   "count": 362,
//                   "ratio": 0.041873915558126085
//               },
//               {
//                   "date": "2023-12-21 00:00:00",
//                   "total_count": 8227,
//                   "count": 361,
//                   "ratio": 0.04387990762124711
//               },
//               {
//                   "date": "2023-12-22 00:00:00",
//                   "total_count": 7284,
//                   "count": 315,
//                   "ratio": 0.04324546952224053
//               },
//               {
//                   "date": "2023-12-23 00:00:00",
//                   "total_count": 3794,
//                   "count": 180,
//                   "ratio": 0.047443331576172906
//               },
//               {
//                   "date": "2023-12-24 00:00:00",
//                   "total_count": 3323,
//                   "count": 188,
//                   "ratio": 0.05657538368943726
//               },
//               {
//                   "date": "2023-12-25 00:00:00",
//                   "total_count": 3064,
//                   "count": 165,
//                   "ratio": 0.05385117493472585
//               },
//               {
//                   "date": "2023-12-26 00:00:00",
//                   "total_count": 5480,
//                   "count": 276,
//                   "ratio": 0.050364963503649635
//               },
//               {
//                   "date": "2023-12-27 00:00:00",
//                   "total_count": 6526,
//                   "count": 328,
//                   "ratio": 0.05026049647563592
//               },
//               {
//                   "date": "2023-12-28 00:00:00",
//                   "total_count": 6518,
//                   "count": 331,
//                   "ratio": 0.050782448603866215
//               },
//               {
//                   "date": "2023-12-29 00:00:00",
//                   "total_count": 6136,
//                   "count": 339,
//                   "ratio": 0.055247718383311606
//               },
//               {
//                   "date": "2023-12-30 00:00:00",
//                   "total_count": 3845,
//                   "count": 217,
//                   "ratio": 0.0564369310793238
//               },
//               {
//                   "date": "2023-12-31 00:00:00",
//                   "total_count": 3698,
//                   "count": 183,
//                   "ratio": 0.0494862087614927
//               },
//               {
//                   "date": "2024-01-01 00:00:00",
//                   "total_count": 3868,
//                   "count": 191,
//                   "ratio": 0.04937952430196484
//               },
//               {
//                   "date": "2024-01-02 00:00:00",
//                   "total_count": 6867,
//                   "count": 329,
//                   "ratio": 0.047910295616717634
//               },
//               {
//                   "date": "2024-01-03 00:00:00",
//                   "total_count": 5509,
//                   "count": 247,
//                   "ratio": 0.04483572336177165
//               },
//               {
//                   "date": "2024-01-04 00:00:00",
//                   "total_count": 3012,
//                   "count": 123,
//                   "ratio": 0.04083665338645418
//               },
//               {
//                   "date": "2024-01-05 00:00:00",
//                   "total_count": 6775,
//                   "count": 316,
//                   "ratio": 0.04664206642066421
//               },
//               {
//                   "date": "2024-01-06 00:00:00",
//                   "total_count": 3682,
//                   "count": 206,
//                   "ratio": 0.05594785442694188
//               },
//               {
//                   "date": "2024-01-07 00:00:00",
//                   "total_count": 4471,
//                   "count": 263,
//                   "ratio": 0.058823529411764705
//               },
//               {
//                   "date": "2024-01-08 00:00:00",
//                   "total_count": 8540,
//                   "count": 411,
//                   "ratio": 0.04812646370023419
//               },
//               {
//                   "date": "2024-01-09 00:00:00",
//                   "total_count": 8846,
//                   "count": 538,
//                   "ratio": 0.060818449016504635
//               },
//               {
//                   "date": "2024-01-10 00:00:00",
//                   "total_count": 9684,
//                   "count": 521,
//                   "ratio": 0.05380008261049153
//               },
//               {
//                   "date": "2024-01-11 00:00:00",
//                   "total_count": 9313,
//                   "count": 512,
//                   "ratio": 0.0549769139911951
//               },
//               {
//                   "date": "2024-01-12 00:00:00",
//                   "total_count": 8645,
//                   "count": 554,
//                   "ratio": 0.06408328513591671
//               },
//               {
//                   "date": "2024-01-13 00:00:00",
//                   "total_count": 4534,
//                   "count": 487,
//                   "ratio": 0.10741067490074989
//               },
//               {
//                   "date": "2024-01-14 00:00:00",
//                   "total_count": 3418,
//                   "count": 370,
//                   "ratio": 0.10825043885313049
//               },
//               {
//                   "date": "2024-01-15 00:00:00",
//                   "total_count": 102,
//                   "count": 5,
//                   "ratio": 0.049019607843137254
//               }
//           ],
//           "total": 10449,
//           "normalized_total": 204337
//       }
//   }
// ]
