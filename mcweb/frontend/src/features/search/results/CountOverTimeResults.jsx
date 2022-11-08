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
import {
  PROVIDER_REDDIT_PUSHSHIFT,
  PROVIDER_YOUTUBE_YOUTUBE,
  PROVIDER_NEWS_MEDIA_CLOUD,
  PROVIDER_TWITTER_TWITTER,
} from '../util/platforms';

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

  const dateHelper = (dateString) => {
    dayjs.extend(utc);
    const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
    return newDate;
  };

  const cleanData = (oldData) => {
    let newData;
    if (platform === PROVIDER_NEWS_MEDIA_CLOUD) {
      if (normalized) {
        newData = oldData.count_over_time.counts.map((day) => (
          [dateHelper(day.date), day.ratio]
        ));
      } else {
        newData = oldData.count_over_time.counts.map((day) => (
          [dateHelper(day.date), day.count]
        ));
      }
    } else {
      newData = oldData.count_over_time.counts.map((day) => [dateHelper(day.date), day.count]);
    }
    return newData;
  };

  useEffect(() => {
    if (queryList[0].length !== 0 && (platform === PROVIDER_NEWS_MEDIA_CLOUD)) {
      normalizedQuery({
        query: queryString,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,
      });
      setNormalized(true);
      setHidden(false);
    } else if (platform === PROVIDER_TWITTER_TWITTER) {
      query({
        query: queryString,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,
      });
      setNormalized(false);
      setHidden(false);
    } else if (platform === PROVIDER_REDDIT_PUSHSHIFT || platform === PROVIDER_YOUTUBE_YOUTUBE) {
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

  if (!data && !normalizedResults.data && !hidden) return null;
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

          {hidden && (
          <Alert severity="warning">Our access doesn&apos;t support fetching attention over time data.</Alert>
          )}
          {!hidden && (
          <>
            <CountOverTimeChart
              data={data ? cleanData(data) : cleanData(normalizedResults.data)}
              normalized={normalized}
            />
            <div className="clearfix">
              {platform === PROVIDER_NEWS_MEDIA_CLOUD && (
              <div className="float-start">
                {normalized && (
                  <Button onClick={() => {
                    setNormalized(false);
                  }}
                  >
                    View Story Count
                  </Button>
                )}
                {!normalized && (
                  <Button onClick={() => {
                    setNormalized(true);
                  }}
                  >
                    View Normalized Story Percentage
                  </Button>
                )}
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
      </div>
    </div>
  );
}
