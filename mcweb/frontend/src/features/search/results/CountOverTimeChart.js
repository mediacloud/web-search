import * as React from 'react';
import { useEffect, useState } from 'react';
import HighCharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useGetCountOverTimeMutation, useDownloadCountsOverTimeCSVMutation } from '../../../app/services/searchApi';
import { queryGenerator } from '../util/queryGenerator';
import Button  from '@mui/material/Button';
import  CircularProgress  from '@mui/material/CircularProgress';

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

    const [hidden, setHidden] = useState(false);

    const queryString = queryGenerator(queryList, negatedQueryList, platform);
    const {countOverTime} = useSelector(state => state.results);
    const [downloadCsv, csvResults] = useDownloadCountsOverTimeCSVMutation();

    const [query, { isLoading, data }] = useGetCountOverTimeMutation();

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
            setHidden(false);
        } else if (platform === PLATFORM_REDDIT || platform === PLATFORM_YOUTUBE) {
            setHidden(true);
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
            type: 'spline',
            height: '300px'
        },
        title: { text: '' },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                month: '%m/%e/%y',
                day: '%m/%e/%y',
                year: '%m/%e/%y'
            },
            title: {
                text: 'Publication Date'
            }
        },
        yAxis: {
            title: {
                text: 'Matching Items'
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
        legend:{ enabled:false },
        colors: ['#2f2d2b'],

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
    
    
    if (isLoading) return (<div> <CircularProgress size="75px" /> </div>);
    if (hidden) return (<h2 className="not-supported-text">Search Over Time Not Currently Supported For This Platform</h2>);
    if (!data ) return null;
    

   return(
      <div className="results-item-wrapper clearfix">
        <h2>Attention Over Time</h2>
        <HighchartsReact highcharts={HighCharts} options={options} />
        <div className="clearfix">
          <div className="float-right">
            <Button variant='text' onClick={() => {
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
        </div>
      </div>
    );
}

