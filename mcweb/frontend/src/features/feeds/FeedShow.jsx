import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import FeedHistory from './FeedHistory';
import StatPanel from '../ui/StatPanel';
import { useGetFeedHistoryQuery, useGetFeedQuery, useGetFeedDetailsQuery } from '../../app/services/feedsApi';

function FeedShow() {
  const params = useParams();
  const feedId = Number(params.feedId);

  const {
    data: feedData,
    isLoading: feedDataLoading,
  } = useGetFeedQuery(feedId);

  const {
    data: feedDetails,
    isLoading: feedDetailsLoading,
  } = useGetFeedDetailsQuery({ feed_id: feedId });

  if (feedDataLoading || feedDetailsLoading) {
    return <CircularProgress size="75px" />;
  }

  if (!feedData || !feedDetails) return null;

  return (
    <div className="container">
      {/* Possible categories if merge feedData and feedDetails */}
      {/* active  */}
      {/* url  */}
      {/* system_enabled  */}
      {/* system_status  */}
      {/* created at */}
      {/* last_fetch_attempt */}
      {/* last_fetch_failures */}
      {/* last_fetch_success */}
      {/* last_new_stories */}
      {/* name (==name) */}
      {/* next_fetch_attempt */}
      {/* queued */}
      {/* sources_id */}
      {/* <StatPanel items={[
        { label: 'First Story', value: source.first_story },
        { label: 'Stories per Week', value: source.stories_per_week },
        { label: 'Publication Country', value: source.pub_country },
        { label: 'Publication State', value: source.pub_state },
        { label: 'Primary Language', value: source.primary_language },
        { label: 'Media Type', value: source.media_type },
      ]}
      /> */}
      {console.log('Details', feedDetails)}
      {console.log('Info', feedData)}
      <div className="row">
        <div className="col-6" />
      </div>

      <div className="row">
        <div className="col-6">
          <FeedHistory feedId={feedId} />
        </div>
      </div>

    </div>
  );
}

export default FeedShow;
