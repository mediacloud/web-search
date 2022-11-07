import * as React from 'react';
import { useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import queryGenerator from '../util/queryGenerator';
import { useGetTotalCountMutation } from '../../../app/services/searchApi';
import { PROVIDER_YOUTUBE_YOUTUBE } from '../util/platforms';

const YOUTUBE_COUNT_MAX = '> 1000000';

export default function TotalAttentionChart() {
  const {
    queryList,
    negatedQueryList,
    platform,
    startDate,
    endDate,
    collections,
    sources,
    lastSearchTime,
    anyAll,
  } = useSelector((state) => state.query);

  const queryString = queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const [query, { isLoading, data }] = useGetTotalCountMutation();
  const collectionIds = collections.map((collection) => collection.id);

  useEffect(() => {
    if (queryList[0].length !== 0) {
      query({
        query: queryString,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,

      });
    }
  }, [lastSearchTime]);

  const options = {
    chart: {
      type: 'bar',
      height: '200px',
    },
    title: { text: '' },
    xAxis: {
      categories: [`${queryString}`, 'Total Stories Count'],
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
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
        },
      },
    },
    legend: { enabled: false },
    credits: {
      enabled: false,
    },
    series: [{
      color: '#2f2d2b',
      name: `query: ${queryString}`,
      data: [data ? data.count : null],
    }],
    // {
    //     name: "Total Stories",
    //     data: [data ? data.all_count.normalized_total : null]
    // }]
  };

  if (isLoading) return (<CircularProgress size="75px" />);
  if (!data) return null;
  // if (isLoading) return ( <CircularProgress size="75px" />);

  return (
    <div className="results-item-wrapper">
      <div className="row">
        <div className="col-4">
          <h2>Total Attention</h2>
          <p>
            Compare the total number of items that matched your queries.
            your queries. Use the &quot;view options&quot; menu to switch between story counts
            and a percentage (if supported).
          </p>
        </div>
        <div className="col-8">
          {/* {console.log(countOverTime ? countOverTime.counts : null)} */}
          { ((platform === PROVIDER_YOUTUBE_YOUTUBE) && (data.count === YOUTUBE_COUNT_MAX)) && (
            <Alert severity="warning">Over 1 million matches. Our access doesn&apos;t support exact counts for numbers this high.</Alert>
          )}
          <HighchartsReact options={options} highcharts={Highcharts} />
        </div>
      </div>
    </div>
  );
}
