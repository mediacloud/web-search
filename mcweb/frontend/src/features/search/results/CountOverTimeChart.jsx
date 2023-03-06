import * as React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import PropTypes from 'prop-types';

export default function CountOverTimeChart({ data, normalized }) {
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

CountOverTimeChart.propTypes = {
  data: PropTypes.shape({
    counts: PropTypes.shape({
      count: PropTypes.number,
      date: PropTypes.string,
      ratio: PropTypes.number,
      total_count: PropTypes.number,
    }),
    normalized_total: PropTypes.number,
    total: PropTypes.number,
  }),
  normalized: PropTypes.bool.isRequired,
};

CountOverTimeChart.defaultProps = {
  data: {
    counts: {
      count: 0,
      date: '',
      ration: 0,
      total_count: 0,
    },
    normalized_total: 0,
    total: 0,
  },
};
