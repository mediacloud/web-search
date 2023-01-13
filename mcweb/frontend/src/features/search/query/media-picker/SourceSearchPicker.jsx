import * as React from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CollectionSelectionTable from './CollectionSelectionTable';
import { useLazyListSourcesQuery } from '../../../../app/services/sourceApi';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';

export default function SourceSearchPicker({ platform }) {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyListSourcesQuery();
  const { previewSources } = useSelector((state) => state.query);

  return (
    <div className="collection-search-picker-container">

      <div className="container">
        <div className="row">

          {/* CollectionSearch */}
          <div className="col-6">
            <TextField fullWidth label="source name" value={query} onChange={(e) => setQuery(e.target.value)} />
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
            {isLoading && <CircularProgress size={75} />}
            {data && (
            <>
              <p>
                {data.count}
                {' '}
                Sources matching &quot;
                {query}
                &quot;
              </p>
              <CollectionSelectionTable
                selected={previewSources}
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

SourceSearchPicker.propTypes = {
  platform: PropTypes.string.isRequired,
};
