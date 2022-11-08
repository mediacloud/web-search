import * as React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import queryGenerator from '../util/queryGenerator';

export default function TotalAttentionChart({ data, normalized }) {
  const {
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query);

  const queryString = queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const options = {
    chart: {
      type: 'bar',
      height: '200px',
    },
    title: { text: '' },
    xAxis: {
      categories: [`${queryString}`, 'Total Stories Count'],
      title: {
        text: null,
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Matching Items',
        align: 'high',
      },
      labels: {
        overflow: 'justify',
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
        },
      },
    },
    legend: { enabled: false },
    credits: {
      enabled: false,
    },
    series: [{
      color: '#2f2d2b',
      name: `query: ${queryString}`,
      data: [data],
    }],
  };

  if (normalized) {
    options.yAxis.labels.format = '{value}%';
  }

  return (
    <div>
      <HighchartsReact options={options} highcharts={Highcharts} />
    </div>
  );
}
