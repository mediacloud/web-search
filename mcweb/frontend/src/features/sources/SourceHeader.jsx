import React, { useState } from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { CircularProgress } from '@mui/material';
import { useParams, Link, Outlet } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useGetSourceQuery, useDeleteSourceMutation, useRescrapeForFeedsMutation } from '../../app/services/sourceApi';
import { useLazyFetchFeedQuery } from '../../app/services/feedsApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import AlertDialog from '../ui/AlertDialog';

export default function SourceHeader() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const [openRefetch, setOpenRefetch] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openRescrape, setOpenRescrape] = useState(false);
  const {
    data: source,
    isLoading,
  } = useGetSourceQuery(sourceId);

  const [fetchFeedTrigger] = useLazyFetchFeedQuery();
  const [deleteSource] = useDeleteSourceMutation();
  const [scrapeForFeeds] = useRescrapeForFeedsMutation();

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
          <Link style={{ textDecoration: 'none', color: 'black' }} to={`/sources/${sourceId}`}>
            <PlatformIcon titleAccess={source.name} fontSize="large" />
                &nbsp;
            {source.label || source.name}
          </Link>
        </h1>
      </Header>
      <ControlBar>
        <Button variant="outlined" endIcon={<SearchIcon titleAccess="search our directory" />}>
          <a
            href={`/search/${urlSerializer([{
              queryList: defaultPlatformQuery(source.platform),
              anyAll: 'any',
              negatedQueryList: [],
              startDate: dayjs().subtract(35, 'day'),
              endDate: dayjs().subtract(5, 'day'),
              collections: [],
              sources: [source],
              platform: defaultPlatformProvider(source.platform),
              advanced: false,
            }])}`}
            target="_blank"
            rel="noreferrer"
          >
            Search Content
          </a>
        </Button>

        <Button variant="outlined" endIcon={<HomeIcon titleAccess="visit this sources homepage" />}>
          <a href={source.homepage} target="_blank" rel="noreferrer">Visit Homepage</a>
        </Button>

        <Button variant="outlined" endIcon={<ListAltIcon titleAccess="source's feeds page" />}>
          <Link to={`/sources/${sourceId}/feeds`}>List Feeds</Link>
        </Button>

        <Permissioned role={ROLE_STAFF}>
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
            endIcon={<LockOpenIcon titleAccess="admin-edit" />}
            secondAction={false}
            confirmButtonText="refetch feeds"
          />

          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin-edit" />}>
            <Link to={`/sources/${sourceId}/edit`}>Edit Source</Link>
          </Button>

          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin-create" />}>
            <Link to={`/sources/${sourceId}/feeds/create`}>Create Feed</Link>
          </Button>

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
            endIcon={<LockOpenIcon titleAccess="admin-delete" />}
            secondAction={false}
            confirmButtonText="delete"
          />

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
            endIcon={<LockOpenIcon titleAccess="admin-delete" />}
            secondAction={false}
            confirmButtonText="Rescrape"
          />

        </Permissioned>
      </ControlBar>
      <Outlet />
    </>
  );
}

// SourceHeader.propTypes = {
//   sourceId: PropTypes.number.isRequired,
// };
