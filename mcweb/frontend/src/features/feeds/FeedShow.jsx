import React from 'react';
import { useParams, Link } from 'react-router-dom';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import dayjs from 'dayjs';
import FeedHistory from './FeedHistory';
import FeedStories from './FeedStories';
import StatPanel from '../ui/StatPanel';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';

import { useGetFeedQuery, useGetFeedDetailsQuery } from '../../app/services/feedsApi';

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

  const details = feedDetails.feed.results;

  return (
    <div className="container">
      <div className="row">
        <h5 className="small-label">
          RSS Feed #
          {' '}
          {feedData.id}
        </h5>
      </div>
      <div className="row">
        <h3 className="feed-title col-10">
          <RssFeedIcon fontSize="large" />
          {' '}
          {feedData.url}
        </h3>
        <Permissioned role={ROLE_STAFF}>
          <Button className="col-2" variant="outlined" endIcon={<LockOpenIcon titleAccess="admin" />}>
            <Link to="edit">Edit</Link>
          </Button>
        </Permissioned>
      </div>
      <StatPanel items={[
        { label: 'Name', value: feedData.name },
        { label: 'Self-Identified Name', value: details.name },
        { label: 'Active', value: String(details.active) },
        { label: 'Admin Enabled', value: String(feedData.admin_rss_enabled) },
        // { label: 'Source ID', value: feedData.source },
        { label: 'System Status', value: details.system_status },
        { label: 'Created At', value: dayjs(details.created_at).format('MM/DD/YYYY HH:mm:ss') },
        { label: 'Last Fetch Attempt', value: dayjs(details.last_fetch_attempt).format('MM/DD/YYYY HH:mm:ss') },
        { label: 'Last Fetch Success', value: dayjs(details.last_fetch_success).format('MM/DD/YYYY HH:mm:ss') },
        { label: 'Last New Stories', value: dayjs(details.last_new_stories).format('MM/DD/YYYY HH:mm:ss') },
        { label: 'Last Fetch Failures', value: String(details.last_fetch_failures) },
        { label: 'Next Fetch Attempt', value: dayjs(details.next_fetch_attempt).format('MM/DD/YYYY HH:mm:ss') },
        { label: 'Queued', value: String(details.queued) },
      ]}
      />

      <div className="row">
        <div className="col-6">
          <FeedHistory feedId={feedId} />
        </div>
        <div className="col-6">
          <FeedStories feedId={feedId} />
        </div>
      </div>

    </div>
  );
}

export default FeedShow;
