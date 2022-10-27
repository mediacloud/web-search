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
        if (queryList[0].length !== 0) {
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
            type: 'bar',
            height: '200px'
        },
        title: { text: '' },
        xAxis: {
            categories: [`${queryString}`, "Total Stories Count"],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Matching Items',
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
        legend:{ enabled:false },
        credits: {
            enabled: false
        },
        series: [{
            color: '#2f2d2b',
            name: `query: ${queryString}`,
            data: [data ? data.count : null]
        }]
        // {
        //     name: "Total Stories",
        //     data: [data ? data.all_count.normalized_total : null]
        // }]
    };

    if (!data) return null;
    return (
      <div className="results-item-wrapper">
        <div className='row'>
          <div className='col-12'>
            <h2>Total Attention: {data.count} </h2>
            {/* {console.log(countOverTime ? countOverTime.counts : null)} */}
            <HighchartsReact highcharts={HighCharts} options={options} />
          </div>
        </div>
      </div>
    );
}
