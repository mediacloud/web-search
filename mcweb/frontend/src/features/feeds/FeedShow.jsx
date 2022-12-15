import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import dayjs from 'dayjs';
import { useGetFeedQuery, useGetFeedHistoryQuery } from '../../app/services/feedsApi';

function FeedShow() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const feedId = Number(params.feedId); // get collection id from wildcard
  const {
    data: feedHistory,
    isLoading: feedHistoryLoading,
  } = useGetFeedHistoryQuery({ feed_id: feedId });
  const { data, isLoading } = useGetFeedQuery(feedId);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div className="container">
      <div className="row">
        <h1 className="col-12">
          Feeds (
          {asNumber(feeds.count)}
          )
        </h1>
      </div>
      {(Math.ceil(feeds.count / PAGE_SIZE) > 1) && (
      <Pagination
        count={Math.ceil(feeds.count / PAGE_SIZE)}
        page={page + 1}
        color="primary"
        onChange={(evt, value) => setPage(value - 1)}
      />
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Admin enabled?</th>
            <th>System enabled?</th>
            <th>System status</th>
            <th>Last Attempt</th>
            <th>Last Success</th>
            <Permissioned role={ROLE_STAFF}>
              <th>Admin</th>
            </Permissioned>
          </tr>
        </thead>
        <tbody>
          {mergedFeeds.map((feed) => (
            <tr key={feed.id}>
              <td>{feed.name}</td>
              <td><a target="_blank" href={`${feed.url}`} rel="noreferrer">{feed.url}</a></td>
              <td>{feed.admin_rss_enabled ? '✅' : '❌'}</td>
              <td>{(feed.details && feed.details.system_enabled) ? '✅' : '❌'}</td>
              <td>{(feed.details && feed.details.system_status) ? feed.details.system_status : '?'}</td>
              <td>{(feed.details && feed.details.last_fetch_attempt) ? dayjs(feed.details.last_fetch_attempt).format('MM/DD/YYYY hh:mm:ss') : '?'}</td>
              <td>{(feed.details && feed.details.last_fetch_success) ? dayjs(feed.details.last_fetch_success).format('MM/DD/YYYY hh:mm:ss') : '?'}</td>
              <td>
                <Permissioned role={ROLE_STAFF}>
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      component={Link}
                      to={`/sources/${sourceId}/feeds/${feed.id}/edit`}
                    >
                      Edit
                    </Button>
                    <Button variant="outlined" startIcon={<DeleteIcon />}>
                      Delete
                    </Button>
                  </>
                </Permissioned>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FeedShow;
