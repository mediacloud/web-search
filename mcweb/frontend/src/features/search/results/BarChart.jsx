import * as React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exporting from 'highcharts/modules/exporting';

exporting(Highcharts);

export default function BarChart({
  normalized, height, title, series,
}) {
  const options = {
    chart: {
      type: 'bar',
      height,
    },
    title: { text: title },
    xAxis: {
      categories: series[0].data.map((d) => d.key),
      title: {
        text: null,
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: normalized ? 'Percentage' : 'Count',
        align: 'high',
      },
      labels: {
        overflow: 'justify',
        format: normalized ? '{value: .2f}%' : '{value.toLocaleString()}',
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
    legend: { enabled: true },
    credits: {
      enabled: false,
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data.map((d) => ({
        y: d.value,
        dataLabels: {
          format: normalized ? `{point.y: ${d.value.toPrecision(4)} %}` : `{point.y: ${d.value.toLocaleString()}}`,
        },
      })),
    })),
  };
  return (
    <div>
      <HighchartsReact options={options} highcharts={Highcharts} />
    </div>
  );
}

BarChart.propTypes = {
  normalized: PropTypes.bool.isRequired,
  height: PropTypes.number,
  title: PropTypes.string.isRequired,
  series: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })),
  })).isRequired,

};

BarChart.defaultProps = {
  height: 200,
};
