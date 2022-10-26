import * as React from 'react';
import { useEffect } from 'react';
import HighCharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useGetCountOverTimeMutation, useDownloadCountsOverTimeCSVMutation } from '../../../app/services/searchApi';
import { queryGenerator } from '../util/queryGenerator';
import Button  from '@mui/material/Button';

export default function CountOverTimeChart(){

    const { queryList,
        negatedQueryList,
        platform,
        startDate,
        endDate,
        collections,
        sources,
        lastSearchTime,
        anyAll } = useSelector(state => state.query);

    const queryString = queryGenerator(queryList, negatedQueryList, platform);

    const [query, { isLoading, data }] = useGetCountOverTimeMutation();
    const [downloadCsv, csvResults] = useDownloadCountsOverTimeCSVMutation();

    const collectionIds = collections.map(collection => collection['id']);

    const PLATFORM_YOUTUBE = "youtube";
    const PLATFORM_REDDIT = "reddit";
        
    useEffect(() => {
        if (queryList[0].length !== 0 && (platform !== PLATFORM_YOUTUBE && platform !== PLATFORM_REDDIT)) {
            query({
                'query': queryString,
                startDate,
                endDate,
                'collections': collectionIds,
                sources,
                platform

            });
        }
    }, [lastSearchTime]);

    const cleanData = () => {
        if (data){
            const newData = data.count_over_time.counts.map(day => [dateHelper(day.date), day.count]);
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
            dateTimeLabelFormats: { 
                month: '%m/%e/%y',
                day: '%m/%e/%y',
                year: '%m/%e/%y'
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

    if (!data) return null;
    if (isLoading) return (<h1>Loading...</h1>);
    return(

        <div className='container'>
            <HighchartsReact highcharts={HighCharts} options={options} />
            <Button variant='outlined' onClick={() => {
                downloadCsv({
                    'query': queryString,
                    startDate,
                    endDate,
                    'collections': collectionIds,
                    sources,
                    platform

                });
            }}>
                Download CSV
            </Button>
        </div>
    );
}
