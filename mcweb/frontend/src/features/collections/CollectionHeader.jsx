import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import ShieldIcon from '@mui/icons-material/Shield';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {
  Outlet, Link, useParams,
} from 'react-router-dom';
import {
  useGetCollectionQuery,
  useDeleteCollectionMutation,
  useRescrapeCollectionMutation,
} from '../../app/services/collectionsApi';
import DownloadSourcesCsv from './util/DownloadSourcesCsv';
import { PermissionedContributor, PermissionedStaff, ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import AlertDialog from '../ui/AlertDialog';
import CopyCollectionDialog from './util/CopyCollectionDialog';

export default function CollectionHeader() {
  const params = useParams();
  if (!params.collectionId) return null;
  const collectionId = Number(params.collectionId);

  const {
    data: collection,
    isFetching,
  } = useGetCollectionQuery(collectionId);

  const [deleteCollection] = useDeleteCollectionMutation();
  const [rescrapeCollection] = useRescrapeCollectionMutation();

  const [open, setOpen] = useState(false);
  const [openRescrape, setOpenRescrape] = useState(false);
  const [openCopy, setOpenCopy] = useState(false);

  if (isFetching) {
    return (<CircularProgress size={75} />);
  }

  const PlatformIcon = platformIcon(collection.platform);

  return (
    <>
      <Header>
        <span className="small-label">
          {platformDisplayName(collection.platform)}
          {' '}
          Collection #
          {collectionId}
        </span>
        <h1>
          <Link style={{ textDecoration: 'none', color: 'black' }} to={`/collections/${collectionId}`}>
            <PlatformIcon fontSize="large" />
            &nbsp;
            {collection.name}
            {!collection.public && <ShieldIcon fontSize="large" titleAccess="private" />}
          </Link>
        </h1>

        {collection.featured && (
          <Chip label="Featured Collection" color="success" />
        )}
        {collection.managed && (
          <Tooltip title="This is a managed collection, to make any changes contact an admin">
            <Chip label="Managed Collection" color="warning" />
          </Tooltip>
        )}
      </Header>

      <ControlBar>
        <Button variant="outlined" startIcon={<SearchIcon titleAccess="search our directory" />}>
          <a
            href={`/search?${urlSerializer([{
              queryList: defaultPlatformQuery(collection.platform),
              anyAll: 'any',
              negatedQueryList: [],
              startDate: dayjs().subtract(34, 'day'),
              endDate: dayjs().subtract(1, 'day'),
              collections: [collection.id],
              sources: [],
              platform: defaultPlatformProvider(collection.platform),
              advanced: false,
            }])}`}
            target="_blank"
            rel="noreferrer"
          >
            Search Content
          </a>
        </Button>

        <DownloadSourcesCsv collectionId={collectionId} />

        <PermissionedContributor>
          <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin edit collection" />}>
            <Link to={`${collectionId}/edit`}>Edit</Link>
          </Button>
          {collection.platform === 'online_news' && (
            <AlertDialog
              outsideTitle="Rescrape Collection For Feeds"
              title={`Rescrape Collection #${collectionId}: ${collection.name} for new feeds?`}
              content="Are you sure you want to rescrape each source in this collection for new feeds?"
              dispatchNeeded={false}
              action={rescrapeCollection}
              actionTarget={collectionId}
              snackbar
              snackbarText="Collection Queued for rescraping!"
              onClick={() => setOpenRescrape(true)}
              openDialog={openRescrape}
              variant="outlined"
              navigateNeeded={false}
              startIcon={<LockOpenIcon titleAccess="admin-rescrape" />}
              secondAction={false}
              confirmButtonText="Rescrape"
            />
          )}
          <CopyCollectionDialog
            outsideTitle="Copy Collection"
            title={`Copy ${platformDisplayName(collection.platform)} Collection #${collectionId}: ${collection.name}`}
            collectionId={collectionId}
            onClick={() => setOpenCopy(true)}
            openDialog={openCopy}
            variant="outlined"
            startIcon={<LockOpenIcon titleAccess="admin-delete" />}
            confirmButtonText="Copy"
          />
        </PermissionedContributor>

        <PermissionedStaff role={ROLE_STAFF}>
          <AlertDialog
            outsideTitle="Delete Collection"
            title={`Delete ${platformDisplayName(collection.platform)} Collection #${collectionId}: ${collection.name}`}
            content={`Are you sure you want to delete ${platformDisplayName(collection.platform)}
                Collection #${collectionId}: ${collection.name} permanently?`}
            dispatchNeeded={false}
            action={deleteCollection}
            actionTarget={collectionId}
            snackbar
            snackbarText="Collection Deleted!"
            onClick={() => setOpen(true)}
            openDialog={open}
            variant="outlined"
            navigateNeeded
            navigateTo="/directory"
            startIcon={<LockOpenIcon titleAccess="admin-copy" />}
            secondAction={false}
            confirmButtonText="Delete"
          />

        </PermissionedStaff>

      </ControlBar>
      <Outlet />
    </>
  );
}

// CollectionHeader.propTypes = {
//   collectionId: PropTypes.number.isRequired,
// };
