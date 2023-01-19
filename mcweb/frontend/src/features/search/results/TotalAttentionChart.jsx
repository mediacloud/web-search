import * as React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exporting from 'highcharts/modules/exporting';

exporting(Highcharts);

export default function TotalAttentionChart({
  normalized, height, title, series,
}) {
  const options = {
    chart: {
      type: 'bar',
      height,
    },
    title: { text: title },
    xAxis: {
      categories: [series.map((s) => s.name)],
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
        format: normalized ? '{value: .2f}%' : '{value}',
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
    series: series.map((s) => ({
      color: s.color,
      name: s.name,
      data: [{
        y: s.value,
        dataLabels: {
          format: normalized ? `{point.y: ${s.value.toPrecision(4)} %}` : `{point.y: ${s.value}}`,
        },
      }],
    })),
  };

  return (
    <div>
      <HighchartsReact options={options} highcharts={Highcharts} />
    </div>
  );
}

TotalAttentionChart.propTypes = {
  normalized: PropTypes.bool.isRequired,
  height: PropTypes.number,
  title: PropTypes.string.isRequired,
  series: PropTypes.arrayOf(PropTypes.shape({
    color: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  })).isRequired,

};

TotalAttentionChart.defaultProps = {
  height: 200,
};
