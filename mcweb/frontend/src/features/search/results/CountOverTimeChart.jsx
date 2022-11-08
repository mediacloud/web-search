import * as React from 'react';
import { useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetCountOverTimeMutation, useDownloadCountsOverTimeCSVMutation } from '../../../app/services/searchApi';
import queryGenerator from '../util/queryGenerator';

export default function CountOverTimeChart() {
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

  const [downloadCsv] = useDownloadCountsOverTimeCSVMutation();

  const [query, { isLoading, data, error }] = useGetCountOverTimeMutation();

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

  const dateHelper = (dateString) => {
    dayjs.extend(utc);
    const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
    return newDate;
  };

  const cleanData = () => {
    if (data) {
      const newData = data.count_over_time.counts.map((day) => [dateHelper(day.date), day.count]);
      return newData;
    }
    return data;
  };

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
    legend: { enabled: false },
    colors: ['#2f2d2b'],

    // Define the data points. All series have a year of 1970/71 in order
    // to be compared on the same x axis. Note that in JavaScript, months start
    // at 0 for January, 1 for February etc.
    series: [
      {
        name: `query: ${queryString}`,
        data: cleanData(),
      },
    ],
  };

  if (isLoading) {
    return (
      <div>
        <CircularProgress size="75px" />
      </div>
    );
  }
  if ((data === undefined) && (error === undefined)) {
    return null;
  }

  let content;
  if (error) {
    // const msg = data.note;
    content = (
      <Alert severity="warning">
        Our access doesn&apos;t support fetching attention over time data.
        (
        { error.data.note }
        )
      </Alert>
    );
  } else {
    content = (
      <>
        <HighchartsReact options={options} highcharts={Highcharts} />
        <div className="clearfix">
          <div className="float-end">
            <Button
              variant="text"
              onClick={() => {
                downloadCsv({
                  query: queryString,
                  startDate,
                  endDate,
                  collections: collectionIds,
                  sources,
                  platform,

                });
              }}
            >
              Download CSV
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="results-item-wrapper clearfix">
      <div className="row">
        <div className="col-4">
          <h2>Attention Over Time</h2>
          <p>
            Compare the attention paid to your queries over time to understand how they are covered.
            This chart shows the number of stories that match each of your queries. Spikes in
            attention can reveal key events. Plateaus can reveal stable, &quot;normal&quot;
            attention levels. Use the &quot;view options&quot; menu to switch between story counts
            and a percentage (if supported).
          </p>
        </div>
        <div className="col-8">
          { content }
        </div>
      </div>
    </div>
  );
}
