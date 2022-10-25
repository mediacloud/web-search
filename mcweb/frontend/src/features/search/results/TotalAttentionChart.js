import * as React from 'react';
import { useEffect } from 'react';
import HighCharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {queryGenerator} from '../util/queryGenerator';
import { useGetTotalCountMutation } from '../../../app/services/searchApi';

export default function TotalAttentionChart() {
    const { queryList, 
            negatedQueryList, 
            platform, 
            startDate, 
            endDate, 
            collections,
            sources,
            lastSearchTime, 
            anyAll } = useSelector(state => state.query);

    const queryString = queryGenerator(queryList, negatedQueryList, platform, anyAll);

    const [query, {isLoading, data}] = useGetTotalCountMutation();
    const collectionIds = collections.map(collection => collection['id']);

    useEffect(()=> {
        if (queryList) {
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
            data: [data ? data.count : null]
        }] 
    };

    if (!data) return null;
    return (

        <div className='container'>
            {/* {console.log(countOverTime ? cleanData(countOverTime) : "")} */}
            <h1 className='total-attention'>Total Attention: {data.count} </h1>
            {/* {console.log(countOverTime ? countOverTime.counts : null)} */}
            <HighchartsReact highcharts={HighCharts} options={options} />
        </div>
    );
}