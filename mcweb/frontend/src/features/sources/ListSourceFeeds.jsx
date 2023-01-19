import React, { useState } from 'react';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { PAGE_SIZE } from '../../app/services/queryUtil';
import { useListFeedsQuery, useListFeedDetailsQuery, useDeleteFeedMutation } from '../../app/services/feedsApi';
import { asNumber } from '../ui/uiUtil';
import AlertDialog from '../ui/AlertDialog';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';

const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc');

function ListSourceFeeds() {
  dayjs.extend(relativeTime);
  dayjs.extend(utc);
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  // query for the list of feeds on this source...
  const {
    data: feeds,
    isLoading: feedsAreLoading,
  } = useListFeedsQuery({ source_id: sourceId });
  // ...and also their latest from the RSS-fetcher
  const {
    data: feedDetails,
    isLoading: feedsDetailsAreLoading,
  } = useListFeedDetailsQuery({ source_id: sourceId });

  const [deleteFeed] = useDeleteFeedMutation();

  const isLoading = feedsAreLoading || feedsDetailsAreLoading;

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  if (!feeds) return null;

  // merge the two datasets
  let mergedFeeds = [];
  if (feeds && feeds.results && feedDetails.feeds) {
    mergedFeeds = feeds.results.map((f) => ({
      ...f,
      details: feedDetails.feeds.find((fd) => fd.id === f.id),
    }));
  }

  // const clickEvent = (e) => {
  //   deleteFeed(e.target.value);
  //   enqueueSnackbar('Feed Queued!', { variant: 'success' });
  // };

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
              <td>
                <Link to={`/feeds/${feed.id}`}>
                  {' '}
                  {feed.name}
                </Link>
              </td>
              <td><a target="_blank" href={`${feed.url}`} rel="noreferrer">{feed.url}</a></td>
              <td>{feed.admin_rss_enabled ? '✅' : '❌'}</td>
              <td>{(feed.details && feed.details.system_enabled) ? '✅' : '❌'}</td>
              <td>{(feed.details && feed.details.system_status) ? feed.details.system_status : '?'}</td>
              <td>
                {(feed.details && feed.details.last_fetch_attempt)
                  ? dayjs.utc(feed.details.last_fetch_attempt).local().format('MM/DD/YYYY HH:mm:ss') : '?'}

              </td>
              <td>
                {(feed.details && feed.details.last_fetch_success)
                  ? dayjs.utc(feed.details.last_fetch_success).local().format('MM/DD/YYYY HH:mm:ss') : '?'}

              </td>
              <td>
                <Permissioned role={ROLE_STAFF}>
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      component={Link}
                      to={`/feeds/${feed.id}/edit`}
                    >
                      Edit
                    </Button>

                    <AlertDialog
                      outsideTitle="Delete"
                      title={`Delete ${feed.name}? `}
                      content={`Are you sure you would like to delete RSS Feed #${feed.id}: ${feed.name}?
                      After confirming, this feed will be permanently deleted.`}
                      dispatchNeeded={false}
                      action={deleteFeed}
                      actionTarget={feed.id}
                      snackbar
                      snackbarText="Feed Deleted!"
                      onClick={() => setOpen(true)}
                      openDialog={open}
                      variant="outlined"
                      endIcon={<DeleteIcon titleAccess="delete-feed" />}
                      secondAction={false}
                      confirmButtonText="Delete"
                    />

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

export default ListSourceFeeds;
