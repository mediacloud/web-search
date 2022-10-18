import * as React from 'react';
import HighCharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

export default function TotalAttentionChart() {
    const { count } = useSelector(state => state.results);
    const { queryString } = useSelector(state => state.query);
    
    // const options = {
    //     chart: {
    //         type: 'bar'
    //     },
    //     title: {
    //         text: 'Total Attention'
    //     },
    //     xAxis: {
    //         type: 'datetime',
    //         dateTimeLabelFormats: {
    //             month: '%e. %m',
    //             day: '%e. %b',
    //             year: '%y'
    //         },
    //         title: {
    //             text: 'Total Attention'
    //         }
    //     },
    //     yAxis: {
    //         title: {
    //             text: 'Number of stories'
    //         },
    //         min: 0
    //     },
    //     tooltip: {
    //         headerFormat: '<b>{series.name}</b><br>',
    //         pointFormat: '{point.x:%b. %e %y} - count: {point.y}'
    //     },

    //     plotOptions: {
    //         bar: {
    //             dataLabels: {
    //                 enabled: true,
    //             }
    //         }
    //     },

    //     colors: ['#6CF', '#39F', '#06C', '#036', '#000'],

    //     // Define the data points. All series have a year of 1970/71 in order
    //     // to be compared on the same x axis. Note that in JavaScript, months start
    //     // at 0 for January, 1 for February etc.
    //     series: [
    //         {
    //             name: `query: ${queryString}`,
    //             data: count,
    //         },
    //     ]
    // };

    const options = {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Total Attention'
        },
        xAxis: {
            categories: [`${queryString}`,],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total Count',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -40,
            y: 80,
            floating: true,
            borderWidth: 1,
            backgroundColor:
                '#FFFFFF',
            shadow: true
        },
        credits: {
            enabled: false
        },
        series: [{
            name: `query: ${queryString}`,
            data: [count]
        }] 
    };

    return (

        <div className='container'>
            {/* {console.log(countOverTime ? cleanData(countOverTime) : "")} */}
            <h1 className='total-attention'>Total Attention: {count} </h1>
            {/* {console.log(countOverTime ? countOverTime.counts : null)} */}
            <HighchartsReact highcharts={HighCharts} options={options} />
        </div>
    );
}