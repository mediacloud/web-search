import * as React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import queryGenerator from '../util/queryGenerator';

export default function CountOverTimeChart({ data, normalized }) {
  const {
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query);

  const queryString = queryGenerator(queryList, negatedQueryList, platform, anyAll);

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
    legend: { enabled: false },
    colors: ['#2f2d2b'],
    series: [
      {
        name: `query: ${queryString}`,
        data,
      },
    ],
  };

  if (normalized) {
    options.yAxis.labels.format = '{value:.1f}%';
    options.tooltip.pointFormat = '{point.x:%b. %e %y} - {point.y:.2f}% of stories';
  }
  return (
    <div>
      <HighchartsReact options={options} highcharts={Highcharts} />
    </div>
  );
}
