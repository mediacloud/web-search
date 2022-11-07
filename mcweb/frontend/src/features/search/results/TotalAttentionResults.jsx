import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import TotalAttentionChart from './TotalAttentionChart';
import queryGenerator from '../util/queryGenerator';
import { useGetTotalCountMutation } from '../../../app/services/searchApi';

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

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="results-item-wrapper">
      <div className="row">
        <div className="col-12">
          <h2>Total Attention</h2>
          <TotalAttentionChart data={data} />
        </div>
      </div>
    </div>
  );
}

export default TotalAttentionResults;
