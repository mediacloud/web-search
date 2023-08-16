import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import {
  useParams, Link, Outlet,
} from 'react-router-dom';
import RSSFeedIcon from '@mui/icons-material/RssFeed';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useSnackbar } from 'notistack';
import { useGetFeedQuery, useLazyFetchFeedQuery, useDeleteFeedMutation } from '../../app/services/feedsApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import AlertDialog from '../ui/AlertDialog';

export default function FeedHeader() {
  const { enqueueSnackbar } = useSnackbar();

  const params = useParams();
  const feedId = Number(params.feedId);
  const [open, setOpen] = useState(false);

  const {
    data: feed,
    isLoading,
  } = useGetFeedQuery(feedId);

  const [fetchFeedTrigger] = useLazyFetchFeedQuery();

  const [deleteFeed] = useDeleteFeedMutation();

  const fetchNow = () => {
    fetchFeedTrigger({ feed_id: feedId });
    enqueueSnackbar('Feed Queued!', { variant: 'success' });
  };

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <>
      <Header>
        <span className="small-label">
          Online News RSS Feed #
          {feed.id}
        </span>
        <h1>
          <Link style={{ textDecoration: 'none', color: 'black' }} to={`/feeds/${feedId}`}>
            <RSSFeedIcon titleAccess={feed.name} fontSize="large" />
            {feed.name || `Feed #${feed.id}`}
          </Link>
        </h1>
      </Header>
      <ControlBar>
        <Button variant="outlined">
          <a href={feed.url} target="_blank" rel="noreferrer">Visit Feed</a>
        </Button>
        <Button variant="outlined">
          <Link to={`/sources/${feed.source}`}>Visit Source</Link>
        </Button>
        <Permissioned role={ROLE_STAFF}>
          <Button
            variant="outlined"
            startIcon={<LockOpenIcon titleAccess="admin" />}
            onClick={fetchNow}
          >
            Fetch Now-ish
          </Button>
          <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin" />}>
            <Link to={`/feeds/${feedId}/edit`}>Edit</Link>
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
            navigateNeeded
            navigateTo={`/sources/${feed.source}/feeds/`}
            onClick={() => setOpen(true)}
            openDialog={open}
            variant="outlined"
            startIcon={<LockOpenIcon titleAccess="admin" />}
            secondAction={false}
            confirmButtonText="Delete"
          />
        </Permissioned>
      </ControlBar>
      <Outlet />
    </>
  );
}
