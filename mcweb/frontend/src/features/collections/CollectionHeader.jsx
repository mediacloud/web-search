// import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import * as React from 'react';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import dayjs from 'dayjs';
import { Button } from '@mui/material';
import { Outlet, Link, useParams } from 'react-router-dom';
import DownloadSourcesCsv from './util/DownloadSourcesCsv';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { PROVIDER_NEWS_WAYBACK_MACHINE } from '../search/util/platforms';

export default function CollectionHeader() {
  const params = useParams();
  if (!params.collectionId) return null;
  const collectionId = Number(params.collectionId);

  const {
    data,
    isLoading,
  } = useGetCollectionQuery(collectionId);
  const collection = data;

  if (isLoading) {
    return (<CircularProgress size={75} />);
  }

  return (
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <span className="small-label">
                {collection.platform}
                {' '}
                Collection #
                {collectionId}
              </span>
              <h1>
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
                  queryList: ['*'],
                  anyAll: 'any',
                  negatedQueryList: [],
                  startDate: dayjs().subtract(35, 'day'),
                  endDate: dayjs().subtract(5, 'day'),
                  collections: [data],
                  platform: PROVIDER_NEWS_WAYBACK_MACHINE,
                  advanced: false,
                })}`} target="_blank">Search Content</a>
              </Button>
              <DownloadSourcesCsv collectionId={collectionId} />
              <Permissioned role={ROLE_STAFF}>
                <Button variant="outlined" component={Link} to={`${collectionId}/edit`}>
                  Edit
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
