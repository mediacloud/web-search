import * as React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import queryGenerator from '../util/queryGenerator';

export default function CountOverTimeChart({ data, normalized }) {
  const {
    queryString,
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query[0]);

  const fullQuery = queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const options = {
    chart: {
      type: 'spline',
      height: '300px',
    },
    title: { text: '' },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        month: '%m/%e/%y',
        day: '%m/%e/%y',
        year: '%m/%e/%y',
      },
      title: {
        text: 'Publication Date',
      },
    },
    yAxis: {
      title: {
        text: 'Matching Items',
      },
      labels: {
        format: '{value}',
      },
      min: 0,
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br>',
      pointFormat: '{point.x:%b. %e %y} - count: {point.y}',
    },
    plotOptions: {
      series: {
        marker: {
          enabled: true,
          radius: 2.5,
        },
      },
    },
    credits: {
      enabled: false,
    },
    legend: { enabled: false },
    colors: ['#2f2d2b', '#d24527', '#2f2d2b', '#d23716', '#f7a44e'],
    series: data,
  };

  console.log(options);

  if (normalized) {
    options.yAxis.labels.format = '{value:.1f}%';
    options.tooltip.pointFormat = '{point.x:%b. %e %y} - {point.y:.2f}% of content';
  }
  return (
    <div>
      <HighchartsReact options={options} highcharts={Highcharts} />
    </div>
  );
}
