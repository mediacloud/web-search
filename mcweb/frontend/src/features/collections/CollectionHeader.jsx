import React, { useState } from 'react';
import { CircularProgress, Button } from '@mui/material';
import dayjs from 'dayjs';
import ShieldIcon from '@mui/icons-material/Shield';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Outlet, Link, useParams } from 'react-router-dom';
import { useGetCollectionQuery, useDeleteCollectionMutation } from '../../app/services/collectionsApi';
import DownloadSourcesCsv from './util/DownloadSourcesCsv';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import AlertDialog from '../ui/AlertDialog';

export default function CollectionHeader() {
  const params = useParams();
  if (!params.collectionId) return null;
  const collectionId = Number(params.collectionId);

  const {
    data: collection,
    isFetching,
  } = useGetCollectionQuery(collectionId);

  const [deleteCollection] = useDeleteCollectionMutation();
  const [open, setOpen] = useState(false);
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
      </Header>
      <ControlBar>
        <Button variant="outlined" endIcon={<SearchIcon titleAccess="search our directory" />}>
          <a
            href={`/search/${urlSerializer({
              queryList: defaultPlatformQuery(collection.platform),
              anyAll: 'any',
              negatedQueryList: [],
              startDate: dayjs().subtract(35, 'day'),
              endDate: dayjs().subtract(5, 'day'),
              collections: [collection],
              sources: [],
              platform: defaultPlatformProvider(collection.platform),
              advanced: false,
            })}`}
            target="_blank"
            rel="noreferrer"
          >
            Search Content

          </a>
        </Button>
        <DownloadSourcesCsv collectionId={collectionId} />
        <Permissioned role={ROLE_STAFF}>
          <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin edit collection" />}>
            <Link to={`${collectionId}/edit`}>Edit</Link>
          </Button>
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
            endIcon={<LockOpenIcon titleAccess="admin-delete" />}
            secondAction={false}
            confirmButtonText="Delete"
          />
        </Permissioned>
      </ControlBar>
      <Outlet />
    </>
  );
}

// CollectionHeader.propTypes = {
//   collectionId: PropTypes.number.isRequired,
// };
