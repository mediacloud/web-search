import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { useGetSourceAssociationsQuery, useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import CollectionItem from './CollectionItem';

export default function CollectionList(props) {
  const { sourceId, edit } = props;
  const {
    data,
    isLoading,
  } = useGetSourceAssociationsQuery(sourceId);

  const [deleteSourceCollectionAssociation] = useDeleteSourceCollectionAssociationMutation();

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  } if (edit) {
    return (
      <div className="collectionAssociations">
        {/* Header */}
        <h2 className="associationsHeader">
          This Source is in
          {data.collections.length}
          {' '}
          Collections
        </h2>
        {data.collections.map((collection) => (
          <div className="collectionItem" key={`edit-${collection.id}`}>

            {/* Collection Item */}
            <CollectionItem collection={collection} />

            {/* Remove */}
            <Button onClick={() => {
              deleteSourceCollectionAssociation({
                source_id: sourceId,
                collection_id: collection.id,
              });
            }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="collectionAssociations">

      {/* Header */}
      <h2>
        {' '}
        Associated with
        {data.collections.length}
        {' '}
        Collections
      </h2>
      {data.collections.map((collection) => (
        <div className="collectionItem" key={`${collection.id}`}>

          {/* Collection */}
          <CollectionItem key={collection.id} collection={collection} />
        </div>
      ))}
    </div>
  );
}
