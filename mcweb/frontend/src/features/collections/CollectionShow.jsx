import * as React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import SourceList from '../sources/SourceList';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);

  const {
    data: collection,
    isLoading,
  } = useGetCollectionQuery(collectionId);

  if (isLoading) {
    return (<CircularProgress size={75} />);
  }
  return (
    <div className="container">
      <div className="row">
        <div className="col-6">
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Notes:</b> {collection.notes}
          </p>
          <SourceList collectionId={collectionId} />
        </div>
      </div>
    </div>
  );
}
