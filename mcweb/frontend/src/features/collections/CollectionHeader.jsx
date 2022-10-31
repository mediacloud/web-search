import { CircularProgress } from '@mui/material';
import * as React from 'react';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionHeader(props) {
  const { collectionId } = props;
  const {
    data,
    isLoading,
  } = useGetCollectionQuery(collectionId);
  const collection = data;

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <div className="collectionHeader">

      {/* Title and Collection ID */}
      <div className="collectionInformation">
        <h2>
          {' '}
          {collection.name}
        </h2>
        <h3>
          {' '}
          Collection #
          {collectionId}
        </h3>
      </div>

    </div>
  );
}
