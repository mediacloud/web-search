import * as React from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CollectionSelectionTable from './CollectionSelectionTable';
import { useLazyGetCollectionSearchQuery } from '../../../../app/services/searchApi';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';

export default function CollectionSearchPicker() {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyGetCollectionSearchQuery();
  const { previewCollections } = useSelector((state) => state.query);

  return (
    <div className="collection-search-picker-container">
      {/* CollectionSearch */}
      <TextField size="large" sx={{ marginTop: '1rem' }} label="Search Collection by Name" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Button sx={{ marginLeft: '1rem', marginTop: '1rem' }} variant="outlined" onClick={() => trigger(query)}>
        Search
      </Button>
      {/* CollectionSearch results? */}
      {isLoading && (
        <div>Loading...</div>
      )}
      {data && (
        <div>
          <p>
            {data.collections.length}
            {' '}
            Collections matching &quot;
            {query}
            &quot;
          </p>

          <CollectionSelectionTable
            selected={previewCollections}
            matching={data.collections}
            onAdd={addPreviewSelectedMedia}
            onRemove={removePreviewSelectedMedia}
          />
        </div>
      )}
    </div>
  );
}
