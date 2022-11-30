import * as React from 'react';
import Highcharts from 'highcharts'
import exporting from "highcharts/modules/exporting";
import HighchartsReact from 'highcharts-react-official'

import { useSelector } from 'react-redux';
import queryGenerator from '../util/queryGenerator';

exporting(Highcharts);

export default function TotalAttentionChart({ data, normalized }) {
  const {
    queryString,
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query);

  const fullQuery = queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const options = {
    chart: {
      type: 'bar',
      height: '200px',
    },
    title: { text: '' },
    xAxis: {
      categories: [`${fullQuery}`, 'Total Stories Count'],
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
        format: '{value}',
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
        },
        pointStart: 0,
      },
    },
    legend: { enabled: false },
    credits: {
      enabled: false,
    },
    series: [{
      color: '#2f2d2b',
      name: `query: ${fullQuery}`,
      data: [{
        y: data,
        dataLabels: {
          format: `{point.y: ${data}}`,
        },
      }],
    }],
  };
  if (normalized) {
    options.yAxis.labels.format = '{value: .1f}%';
    options.series[0].data[0].dataLabels = { format: `{point.y: ${data} %}` };
  }

  return (
    <div>
      <HighchartsReact options={options} highcharts={Highcharts} />
    </div>
  );
}
