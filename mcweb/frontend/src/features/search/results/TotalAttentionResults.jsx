import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import TotalAttentionChart from './TotalAttentionChart';
import queryGenerator from '../util/queryGenerator';
import { useGetTotalCountMutation, useGetNormalizedCountOverTimeMutation } from '../../../app/services/searchApi';

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

  const PLATFORM_ONLINE_NEWS = 'onlinenews';
  const [normalized, setNormalized] = useState(true);
  const [query, { isLoading, data }] = useGetTotalCountMutation();
  const [normalizedQuery, nqResult] = useGetNormalizedCountOverTimeMutation();

  const collectionIds = collections.map((collection) => collection.id);
  const normalizeData = (data) => {
    const { total } = data;
    const normalizedTotal = data.normalized_total;
    const normalizedPercentage = (total / normalizedTotal);
    console.log(total, normalizedTotal);
    console.log(normalizedPercentage);
  };

  useEffect(() => {
    if (platform === PLATFORM_ONLINE_NEWS) {
      normalizedQuery({
        query: queryString,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,
      });
      setNormalized(true);
    } else {
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
        <div className="col-12">
          <h2>Total Attention</h2>
          <TotalAttentionChart
            data={data || normalizeData(nqResult.data)}
            normalized={normalized}
          />
        </div>
      </div>
    </div>
  );
}

export default TotalAttentionResults;
