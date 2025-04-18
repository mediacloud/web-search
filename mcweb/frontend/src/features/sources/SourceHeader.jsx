import React, { useState } from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { CircularProgress } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockClosedIcon from '@mui/icons-material/Lock';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useGetSourceQuery, useDeleteSourceMutation, useRescrapeForFeedsMutation } from '../../app/services/sourceApi';
import { useLazyFetchFeedQuery, useListFeedsQuery } from '../../app/services/feedsApi';
import { PermissionedContributor, PermissionedStaff, ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import AlertDialog from '../ui/AlertDialog';
import MediaNotFound from '../ui/MediaNotFound';

export default function SourceHeader() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const [openRefetch, setOpenRefetch] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openRescrape, setOpenRescrape] = useState(false);
  const {
    data: source,
    isLoading,
    error,
  } = useGetSourceQuery(sourceId);

  const {
    data: feeds,
    isLoading: feedsAreLoading,
  } = useListFeedsQuery({ source_id: sourceId });

  const [fetchFeedTrigger] = useLazyFetchFeedQuery();
  const [deleteSource] = useDeleteSourceMutation();
  const [scrapeForFeeds] = useRescrapeForFeedsMutation();

  if (isLoading || feedsAreLoading) {
    return <CircularProgress size="75px" />;
  }

  if (error) { return <MediaNotFound source />; }

  const PlatformIcon = platformIcon(source.platform);
  const feedCount = feeds ? feeds.count : 0;

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

        <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin-edit" />}>
          <Link to={`/sources/${sourceId}/edit`}>Edit Source</Link>
        </Button>

        {source.url_search_string && (
          <Button
            variant="outlined"
            disabled
            startIcon={(
              <LockClosedIcon
                titleAccess="child sources should not have feeds"
              />
                    )}
          >
            Child Sources should not have feeds
          </Button>
        )}

        {!source.url_search_string && (
          <Button
            variant="outlined"
            startIcon={(
              <ListAltIcon
                titleAccess="source's feeds page"
              />
            )}
          >
            <Link
              to={`/sources/${sourceId}/feeds`}
            >
              {feedCount === 0 ? 'Add Feeds' : `List Feeds (${feedCount}) `}
            </Link>
          </Button>
        )}

        <PermissionedContributor>
          <AlertDialog
            outsideTitle="Refetch Feeds"
            title={`Refetch all of ${source.name} feeds`}
            content="Are you sure you would like to refetch all feeds for this source?
                      After confirming the feeds will be queued for refetching.
                      You can check back at this page in a few minutes to see changes"
            dispatchNeeded={false}
            action={fetchFeedTrigger}
            actionTarget={{ source_id: sourceId }}
            snackbar
            snackbarText="Feeds Queued!"
            onClick={() => setOpenRefetch(true)}
            openDialog={openRefetch}
            variant="outlined"
            startIcon={<LockOpenIcon titleAccess="admin-edit" />}
            secondAction={false}
            confirmButtonText="refetch feeds"
            disabled={!!source.url_search_string}
          />

          {!source.url_search_string && (
            <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin-create" />}>
              <Link to={`/sources/${sourceId}/feeds/create`}>Create Feed</Link>
            </Button>
          )}

          {source.platform === 'online_news' && (

            <AlertDialog
              outsideTitle="Rescrape Source"
              title={`Rescrape Source ${source.name} for new Feeds`}
              content={`Are you sure you would like to rescrape ${source.name} for new feeds?
             Confirming will place this source in a queue to be rescraped for new feeds`}
              dispatchNeeded={false}
              action={scrapeForFeeds}
              actionTarget={sourceId}
              snackbar
              snackbarText="Source Queued for Rescraping"
              onClick={() => setOpenRescrape(true)}
              openDialog={openRescrape}
              variant="outlined"
              navigateNeeded={false}
              startIcon={<LockOpenIcon titleAccess="admin-delete" />}
              secondAction={false}
              confirmButtonText="Rescrape"
              disabled={!!source.url_search_string}
            />
          )}
        </PermissionedContributor>

        <PermissionedStaff role={ROLE_STAFF}>
          <AlertDialog
            outsideTitle="Delete Source"
            title={`Delete ${platformDisplayName(source.platform)} Source #${sourceId}: ${source.name}`}
            content={`Are you sure you want to delete ${platformDisplayName(source.platform)}
                Source #${sourceId}: ${source.name} permanently?`}
            dispatchNeeded={false}
            action={deleteSource}
            actionTarget={sourceId}
            snackbar
            snackbarText="Source Deleted!"
            onClick={() => setOpenDelete(true)}
            openDialog={openDelete}
            variant="outlined"
            navigateNeeded
            navigateTo="/directory"
            startIcon={<LockOpenIcon titleAccess="admin-delete" />}
            secondAction={false}
            confirmButtonText="delete"
          />

        </PermissionedStaff>
      </ControlBar>
      <Outlet />
    </>
  );
}
