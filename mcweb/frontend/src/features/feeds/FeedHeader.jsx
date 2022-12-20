import * as React from 'react';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { useParams, Link, Outlet } from 'react-router-dom';
import RSSFeedIcon from '@mui/icons-material/RssFeed';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useGetFeedQuery } from '../../app/services/feedsApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';

export default function FeedHeader() {
  const params = useParams();
  const feedId = Number(params.feedId);
  const {
    data: feed,
    isLoading,
  } = useGetFeedQuery(feedId);

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
        <Permissioned role={ROLE_STAFF}>
          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin" />}>
            Fetch Now-ish
          </Button>
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
