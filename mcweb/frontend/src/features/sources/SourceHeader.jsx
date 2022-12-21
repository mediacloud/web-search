import * as React from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { useParams, Link, Outlet } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useSnackbar } from 'notistack';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import { useLazyFetchFeedQuery } from '../../app/services/feedsApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';

export default function SourceHeader() {
  const { enqueueSnackbar } = useSnackbar();

  const params = useParams();
  const sourceId = Number(params.sourceId);

  const {
    data: source,
    isLoading,
  } = useGetSourceQuery(sourceId);

  const [fetchFeedTrigger, {
    isFetching: isFetchFeedFetching, data: fetchFeedResults,
  }] = useLazyFetchFeedQuery();

  const clickEvent = () => {
    fetchFeedTrigger({ source_id: sourceId });
    enqueueSnackbar('Feed Queued!', { variant: 'success' });
  };

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  const PlatformIcon = platformIcon(source.platform);

  return (
    <>
      <Header>
        <span className="small-label">
          {platformDisplayName(source.platform)}
          {' '}
          Source #
          {sourceId}
        </span>
        <h1>
          <PlatformIcon titleAccess={source.name} fontSize="large" />
                &nbsp;
          {source.label || source.name}
        </h1>
      </Header>
      <ControlBar>
        <Button variant="outlined">
          <a
            href={`/search/${urlSerializer({
              queryList: defaultPlatformQuery(source.platform),
              anyAll: 'any',
              negatedQueryList: [],
              startDate: dayjs().subtract(35, 'day'),
              endDate: dayjs().subtract(5, 'day'),
              collections: [],
              sources: [source],
              platform: defaultPlatformProvider(source.platform),
              advanced: false,
            })}`}
            target="_blank"
            rel="noreferrer"
          >
            Search Content
          </a>
        </Button>
        <Button variant="outlined">
          <a href={source.homepage} target="_blank" rel="noreferrer">Visit Homepage</a>
        </Button>
        <Button variant="outlined">
          <Link to={`/sources/${sourceId}/feeds`}>List Feeds</Link>
        </Button>
        <Permissioned role={ROLE_STAFF}>
          <Button
            variant="outlined"
            onClick={clickEvent}
            endIcon={<LockOpenIcon titleAccess="admin-edit" />}
          >
            Refetch Feeds
          </Button>
          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin-edit" />}>
            <Link to={`/sources/${sourceId}/edit`}>Edit Source</Link>
          </Button>
          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin-create" />}>
            <Link to={`/sources/${sourceId}/feeds/create`}>Create Feed</Link>
          </Button>
        </Permissioned>
      </ControlBar>
      <Outlet />
    </>
  );
}

// SourceHeader.propTypes = {
//   sourceId: PropTypes.number.isRequired,
// };
