import React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import dayjs from 'dayjs';

import FeedHistory from './FeedHistory';
import FeedStories from './FeedStories';

import { useGetFeedQuery, useGetFeedDetailsQuery } from '../../app/services/feedsApi';

const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc');

function FeedShow() {
  dayjs.extend(relativeTime);
  dayjs.extend(utc);
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

  const isEnabled = details.active && feedData.admin_rss_enabled;
  let enabledLabel = isEnabled ? 'enabled' : 'disabled';
  if (!isEnabled) {
    enabledLabel += (feedData.admin_rss_enabled) ? ' (by admin)' : ' (by system)';
  }
  const isWorking = details.system_status === 'Working';
  const workingLabel = isWorking ? 'working' : 'not working';

  return (
    <div className="container">

      <div className="row">
        <div className="col-12">
          <h3>Basic Info</h3>
          <p>
            <b>Internal Name:</b>
            {' '}
            {details.name}
          </p>
          <div>
            <b>Status</b>
            :
            &nbsp;
            <Chip label={enabledLabel} color={(isEnabled) ? 'success' : 'error'} />
            &nbsp;
            <Chip label={workingLabel} color={(isWorking) ? 'success' : 'error'} />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <h3>Fetch Info</h3>
          <ul>
            <li>
              Last New Story:
              {' '}
              {`${dayjs.utc(details.last_new_stories).local().fromNow()}
               (${dayjs.utc(details.last_new_stories).local().format('MM/DD/YYYY HH:mm:ss')})`}
            </li>
            <li>
              Last Fetch Attempt:
              {' '}
              {`${dayjs.utc(details.last_fetch_attempt).local().fromNow()}
               (${dayjs.utc(details.last_fetch_attempt).local().format('MM/DD/YYYY HH:mm:ss')})`}
            </li>
            <li>
              Last Fetch Success:
              {' '}
              {`${dayjs.utc(details.last_fetch_success).local().fromNow()}
               (${dayjs.utc(details.last_fetch_success).local().format('MM/DD/YYYY HH:mm:ss')})`}
            </li>
            <li>
              Next Fetch Attempt:
              {' '}
              {`${dayjs.utc(details.next_fetch_attempt).local().fromNow()}
               (${dayjs.utc(details.next_fetch_attempt).local().format('MM/DD/YYYY HH:mm:ss')})`}
              {details.queued && 'a fetch attempt is currently in the queue'}
            </li>
            <li>
              Fetch Failures in a Row:
              {' '}
              {details.last_fetch_failures}
              {' '}
              (to many of these and the system will disable this feed)
            </li>
          </ul>
        </div>
      </div>

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
