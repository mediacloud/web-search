import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import * as React from 'react';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionHeader({ collectionId }) {
  const {
    data,
    isLoading,
  } = useGetCollectionQuery(collectionId);
  const collection = data;

  if (isLoading) {
    return (<CircularProgress size={75} />);
  }

  return (
    <div className="collectionHeader">
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
    </div>
  );
}

CollectionHeader.propTypes = {
  collectionId: PropTypes.number.isRequired,
};
