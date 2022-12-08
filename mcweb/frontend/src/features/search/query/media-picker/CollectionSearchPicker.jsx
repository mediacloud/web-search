import * as React from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CollectionSelectionTable from './CollectionSelectionTable';
import { useLazyListCollectionsQuery } from '../../../../app/services/collectionsApi';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';

export default function CollectionSearchPicker() {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyListCollectionsQuery();
  const { previewCollections } = useSelector((state) => state.query);

  return (
    <div className="collection-search-picker-container">

      <div className="container">
        <div className="row">

          {/* CollectionSearch */}
          <div className="col-6">
            <TextField fullWidth label="collection name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="col-6">
            <Button size="large" variant="contained" onClick={() => trigger({name: query})}>
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
                <CollectionSelectionTable
                  selected={previewCollections}
                  matching={data.results}
                  onAdd={addPreviewSelectedMedia}
                  onRemove={removePreviewSelectedMedia}
                />
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
