import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import TotalAttentionChart from './TotalAttentionChart';
import queryGenerator from '../util/queryGenerator';
import { useGetTotalCountMutation, useGetNormalizedCountOverTimeMutation } from '../../../app/services/searchApi';
import { PROVIDER_YOUTUBE_YOUTUBE, PROVIDER_NEWS_MEDIA_CLOUD } from '../util/platforms';

const YOUTUBE_COUNT_MAX = '> 1000000';

function TotalAttentionResults() {
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

  const [normalized, setNormalized] = useState(true);

  const [query, { isLoading, data }] = useGetTotalCountMutation();

  const [normalizedQuery, nqResult] = useGetNormalizedCountOverTimeMutation();

  const collectionIds = collections.map((collection) => collection.id);

  const normalizeData = (oldData) => {
    let newData;
    if (platform === PROVIDER_NEWS_MEDIA_CLOUD) {
      const { total } = oldData;
      const normalizedTotal = oldData.normalized_total;
      if (normalized) {
        newData = (total / normalizedTotal);
      } else {
        newData = total;
      }
    } else {
      newData = oldData.count;
    }
    return newData;
  };

  useEffect(() => {
    if (queryList[0].length !== 0 && platform === PROVIDER_NEWS_MEDIA_CLOUD) {
      normalizedQuery({
        query: queryString,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,
      });
      setNormalized(true);
    } else if (queryList[0].length !== 0) {
      query({
        query: queryString,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,

      });
      setNormalized(false);
    }
  }, [lastSearchTime]);

  if (isLoading || nqResult.isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  if (!data && !nqResult.data) return null;

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
          {((platform === PROVIDER_YOUTUBE_YOUTUBE) && (data.count === YOUTUBE_COUNT_MAX)) && (
            <Alert severity="warning">Over 1 million matches. Our access doesn&apos;t support exact counts for numbers this high.</Alert>
          )}
          <TotalAttentionChart
            data={data ? normalizeData(data) : normalizeData(nqResult.data.count_over_time)}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default TotalAttentionResults;
