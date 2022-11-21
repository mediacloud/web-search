import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSourceFeedsQuery } from '../../app/services/feedsApi';

function FeedShow({ sourceId }) {
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

FeedShow.propTypes = {
  sourceId: PropTypes.number.isRequired,
};

export default FeedShow;
