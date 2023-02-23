import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MediaPickerSelectionTable from './MediaPickerSelectionTable';
import { useLazyListCollectionsQuery } from '../../../../app/services/collectionsApi';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';

export default function CollectionSearchPicker({ platform, queryIndex }) {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyListCollectionsQuery();
  const { previewCollections } = useSelector((state) => state.query[queryIndex]);

  return (
    <div className="collection-search-picker-container">

      <div className="container">
        <div className="row">

          {/* CollectionSearch */}
          <div className="col-6">
            <TextField fullWidth label="collection name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="col-6">
            <Button size="large" variant="contained" onClick={() => trigger({ platform, name: query })}>
              Search
            </Button>
          </div>

        </div>
        <div className="row">
          <div className="col-12">

            {/* CollectionSearch results? */}
            { isLoading && <CircularProgress size={75} /> }
            {data && (
              <>
                <p>
                  {data.count}
                  {' '}
                  Collections matching &quot;
                  {query}
                  &quot;
                </p>
                <MediaPickerSelectionTable
                  selected={previewCollections}
                  matching={data.results}
                  onAdd={addPreviewSelectedMedia}
                  onRemove={removePreviewSelectedMedia}
                  collection
                />
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

CollectionSearchPicker.propTypes = {
  platform: PropTypes.string.isRequired,
  queryIndex: PropTypes.number.isRequired,
};
