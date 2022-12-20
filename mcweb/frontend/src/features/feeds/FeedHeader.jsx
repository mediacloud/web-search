import * as React from 'react';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { useParams, Link, Outlet } from 'react-router-dom';
import RSSFeedIcon from '@mui/icons-material/RssFeed';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useSnackbar } from 'notistack';
import { useGetFeedQuery, useLazyFetchFeedQuery } from '../../app/services/feedsApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';

export default function FeedHeader() {
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();
  const feedId = Number(params.feedId);

  const {
    data: feed,
    isLoading,
  } = useGetFeedQuery(feedId);

  const [fetchFeedTrigger, {
    isFetching: isFetchFeedFetching, data: fetchFeedResults,
  }] = useLazyFetchFeedQuery();

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
          <RSSFeedIcon titleAccess={feed.name} fontSize="large" />
          {feed.name || `Feed #${feed.id}`}
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
            endIcon={<LockOpenIcon titleAccess="admin" />}
            onClick={() => fetchFeedTrigger({ feed_ids: [feedId] })}
          >
            Fetch Now-ish
          </Button>
          {/* {fetchFeedResults && (console.log(fetchFeedResults), enqueueSnackbar('Feed Queued!', { variant: 'success' }))} */}
          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin" />}>
            <Link to={`/feeds/${feedId}/edit`}>Edit</Link>
          </Button>
          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin" />}>
            Delete
          </Button>
        </Permissioned>
      </ControlBar>
      <Outlet />
    </>
  );
}
