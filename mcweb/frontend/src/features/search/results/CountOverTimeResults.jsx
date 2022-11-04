import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import queryGenerator from '../util/queryGenerator';
import CountOverTimeChart from './CountOverTimeChart';
import {
  useDownloadCountsOverTimeCSVMutation,
  useGetCountOverTimeMutation,
  useGetNormalizedCountOverTimeMutation,
} from '../../../app/services/searchApi';
// import { PLATFORM_YOUTUBE, PLATFORM_REDDIT } from '../Search';

export default function CountOverTimeResults() {
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

  const [hidden, setHidden] = useState(false);
  const [normalized, setNormalized] = useState(true);
  const queryString = queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const [downloadCsv] = useDownloadCountsOverTimeCSVMutation();

  const [query, { isLoading, data }] = useGetCountOverTimeMutation();
  const [normalizedQuery, normalizedResults] = useGetNormalizedCountOverTimeMutation();

  const collectionIds = collections.map((collection) => collection.id);

  const PLATFORM_YOUTUBE = 'youtube';
  const PLATFORM_REDDIT = 'reddit';
  const PLATFORM_ONLINE_NEWS = 'onlinenews';

  const dateHelper = (dateString) => {
    dayjs.extend(utc);
    const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
    return newDate;
  };

  const cleanData = (oldData) => {
    let newData;
    if (oldData.normalized_count_over_time) {
      newData = oldData.normalized_count_over_time.counts.map((day) => (
        [dateHelper(day.date), day.ratio]
      ));
    } else {
      newData = oldData.count_over_time.counts.map((day) => [dateHelper(day.date), day.count]);
    }
    return newData;
  };

  useEffect(() => {
    if (queryList[0].length !== 0
      && (platform !== PLATFORM_YOUTUBE && platform !== PLATFORM_REDDIT)) {
      if (platform === PLATFORM_ONLINE_NEWS || normalized) {
        setNormalized(true);
        normalizedQuery({
          query: queryString,
          startDate,
          endDate,
          collections: collectionIds,
          sources,
          platform,
        });
      } else {
        setNormalized(false);
        query({
          query: queryString,
          startDate,
          endDate,
          collections: collectionIds,
          sources,
          platform,
        });
      }
      setHidden(false);
    } else if (platform === PLATFORM_REDDIT || platform === PLATFORM_YOUTUBE) {
      setHidden(true);
    }
  }, [lastSearchTime]);

  if (isLoading || normalizedResults.isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  if (!data && !normalizedResults.data) return null;
  // if (!normalizedResults.data) return null;
  return (
    <div className="results-item-wrapper clearfix">
      <h2>Attention Over Time</h2>

      {hidden && (
        <Alert severity="warning">Our access doesn't support fetching attention over time data.</Alert>
      )}
      {!hidden && (
        <>
          <CountOverTimeChart
            data={cleanData(data || normalizedResults.data)}
            normalized={normalized}
          />
          <div className="clearfix">
            {platform === PLATFORM_ONLINE_NEWS && (
              <div className="float-start">
                <Button onClick={() => {
                  setNormalized(true);
                }}
                >
                  View Options
                </Button>
              </div>
            )}
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
      )}

    </div>
  );
}
