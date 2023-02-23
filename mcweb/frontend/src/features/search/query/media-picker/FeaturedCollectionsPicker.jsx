import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';
import { useGetFeaturedCollectionsQuery } from '../../../../app/services/collectionsApi';
import MediaPickerSelectionTable from './MediaPickerSelectionTable';

export default function FeaturedCollectionsPicker({ platform, queryIndex }) {
  const { data, isLoading } = useGetFeaturedCollectionsQuery({ platform });

  const { previewCollections } = useSelector((state) => state.query[queryIndex]);

  if (isLoading) {
    return (<div>Loading...</div>);
  }

  return (
    <div className="container featured-collections-container">
      <MediaPickerSelectionTable
        selected={previewCollections}
        matching={data.collections}
        onAdd={addPreviewSelectedMedia}
        onRemove={removePreviewSelectedMedia}
        collection
      />
    </div>
  );
}

FeaturedCollectionsPicker.propTypes = {
  platform: PropTypes.string.isRequired,
  queryIndex: PropTypes.number.isRequired,
};
