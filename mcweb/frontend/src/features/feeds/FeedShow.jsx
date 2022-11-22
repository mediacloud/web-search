import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams } from 'react-router-dom';
import { useGetSourceFeedsQuery } from '../../app/services/feedsApi';

function FeedShow() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const {
    isLoading, data,
  } = useGetSourceFeedsQuery(sourceId);

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <>
      <h1>Feeds</h1>
      {console.log(data)}
    </>
  );
}

export default FeedShow;
