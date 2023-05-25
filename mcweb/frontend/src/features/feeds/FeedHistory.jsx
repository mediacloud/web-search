import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import { useGetFeedHistoryQuery } from '../../app/services/feedsApi';

const utc = require('dayjs/plugin/utc');

function FeedHistory({ feedId }) {
  dayjs.extend(utc);

  const {
    data,
    isLoading,
  } = useGetFeedHistoryQuery({ feed_id: feedId });

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  if (!data) return null;

  return (
    <>
      <h1>Feed History</h1>
      <table className="col-12">

        <thead>
          <tr className="row">
            <th className="col-4">Event</th>
            <th className="col-4">Time</th>
            <th className="col-4">Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.feed.map((feedEvent) => (
            <tr key={feedEvent.id} className="row">
              <td className="col-4">{feedEvent.event}</td>
              <td className="col-4">{dayjs.utc(feedEvent.created_at).local().format('MM/DD/YYYY HH:mm:ss')}</td>
              <td className="col-4">{feedEvent.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

FeedHistory.propTypes = {
  feedId: PropTypes.number.isRequired,
};

export default FeedHistory;
