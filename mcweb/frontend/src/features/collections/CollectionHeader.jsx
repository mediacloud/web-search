// import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import * as React from 'react';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import dayjs from 'dayjs';
import { Button } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Outlet, Link, useParams } from 'react-router-dom';
import DownloadSourcesCsv from './util/DownloadSourcesCsv';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';

export default function CollectionHeader() {
  const params = useParams();
  if (!params.collectionId) return null;
  const collectionId = Number(params.collectionId);

  const {
    data: collection,
    isLoading,
  } = useGetCollectionQuery(collectionId);

  if (isLoading) {
    return (<CircularProgress size={75} />);
  }

  const PlatformIcon = platformIcon(collection.platform);

  return (
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <span className="small-label">
                {platformDisplayName(collection.platform)}
                {' '}
                Collection #
                {collectionId}
              </span>
              <h1>
                <PlatformIcon  fontSize="large" />
                &nbsp;
                {collection.name}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="sub-feature">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <Button variant="outlined">
                <a href={`/search/${urlSerializer({
                  queryList: defaultPlatformQuery(collection.platform),
                  anyAll: 'any',
                  negatedQueryList: [],
                  startDate: dayjs().subtract(35, 'day'),
                  endDate: dayjs().subtract(5, 'day'),
                  collections: [collection],
                  sources: [],
                  platform: defaultPlatformProvider(collection.platform),
                  advanced: false,
                })}`} target="_blank">Search Content</a>
              </Button>
              <DownloadSourcesCsv collectionId={collectionId} />
              <Permissioned role={ROLE_STAFF}>
                <Button variant="outlined" endIcon={<LockOpenIcon />}>
                  <Link to={`${collectionId}/edit`}>Edit</Link>
                </Button>
              </Permissioned>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}

// CollectionHeader.propTypes = {
//   collectionId: PropTypes.number.isRequired,
// };
