import * as React from 'react';
import HighCharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

export default function CountOverTimeChart(){
    const {countOverTime, count} = useSelector(state => state.results);
    const {queryString} = useSelector(state =>state.query);
    const cleanData = () => {
        if (countOverTime){
            const newData = countOverTime.counts.map(day => [dateHelper(day.date), day.count]);
            return newData;
        }
    };

    const dateHelper = (dateString) => {
        dayjs.extend(utc);
        const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
        return newDate;
    };

    const options = {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Attention Over Time'
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the year
                day: '%e. %b',
                month: '%e. %m',
                year: '%y'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Number of stories'
            },
            min: 0
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%b. %e %y} - count: {point.y}'
        },

        plotOptions: {
            series: {
                marker: {
                    enabled: true,
                    radius: 2.5
                }
            }
        },

        colors: ['#6CF', '#39F', '#06C', '#036', '#000'],

        // Define the data points. All series have a year of 1970/71 in order
        // to be compared on the same x axis. Note that in JavaScript, months start
        // at 0 for January, 1 for February etc.
        series: [
            {
                name: `query: ${queryString}`,
                data: cleanData(),
            }, 
        ]
    };

    return(

        <div className='container'>
            {/* {console.log(countOverTime ? cleanData(countOverTime) : "")} */}
            
            {/* {console.log(countOverTime ? countOverTime.counts : null)} */}
            <HighchartsReact highcharts={HighCharts} options={options} />
        </div>
    );
}
