import * as React from 'react';
import { useSelector } from 'react-redux';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';
import { useGetFeaturedCollectionsQuery } from '../../../../app/services/collectionsApi';
import CollectionSelectionTable from './CollectionSelectionTable';

export default function FeaturedCollectionsPicker() {
  const { data, isLoading } = useGetFeaturedCollectionsQuery();

  const { previewCollections } = useSelector((state) => state.query);

  if (isLoading) {
    return (<div>Loading...</div>);
  }
  return (
    <div className="container featured-collections-container">
      <CollectionSelectionTable
        selected={previewCollections}
        matching={data.collections}
        onAdd={addPreviewSelectedMedia}
        onRemove={removePreviewSelectedMedia}
      />
    </div>
  );
}
