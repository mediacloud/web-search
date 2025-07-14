import React from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import CircularProgress from '@mui/material/CircularProgress';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import { PermissionedContributor } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import MediaNotFound from '../ui/MediaNotFound';
import AdvancedMenu from './util/AdvancedMenu';
import FeedMenu from './util/FeedMenu';

export default function SourceHeader() {
  const params = useParams();
  const sourceId = Number(params.sourceId);

  const {
    data: source,
    isLoading,
    error,
  } = useGetSourceQuery(sourceId);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  if (error) { return <MediaNotFound source />; }

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
          <Link style={{ textDecoration: 'none', color: 'black' }} to={`/sources/${sourceId}`}>
            <PlatformIcon titleAccess={source.name} fontSize="large" />
            &nbsp;
            {source.label || source.name}
          </Link>
        </h1>
        {source.url_search_string && (
          <Tooltip title="A Child Source is a subdomain of a parent source, but queries target only this subdomain.
          It should have no feeds of its own, only a URL search string, while all feeds remain attached to the parent source."
          >
            <Chip label="Child Source" color="warning" />
          </Tooltip>
        )}
      </Header>
      <ControlBar>
        <Button variant="outlined" startIcon={<SearchIcon titleAccess="search our directory" />}>
          <a
            href={`/search?${urlSerializer([{
              queryList: defaultPlatformQuery(source.platform),
              anyAll: 'any',
              negatedQueryList: [],
              startDate: dayjs().subtract(35, 'day'),
              endDate: dayjs().subtract(5, 'day'),
              collections: [],
              sources: [source.id],
              platform: defaultPlatformProvider(source.platform),
              advanced: false,
            }])}`}
            target="_blank"
            rel="noreferrer"
          >
            Search Content
          </a>
        </Button>

        <Button variant="outlined" startIcon={<HomeIcon titleAccess="visit this sources homepage" />}>
          <a href={source.homepage} target="_blank" rel="noreferrer">Visit Homepage</a>
        </Button>

        <PermissionedContributor>
          <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin-edit" />}>
            <Link to={`/sources/${sourceId}/edit`}>Edit Source</Link>
          </Button>

          <FeedMenu
            source={source}
            disabled={!!source.url_search_string}
          />
          <AdvancedMenu source={source} />
        </PermissionedContributor>
      </ControlBar>
      <Outlet />
    </>
  );
}
