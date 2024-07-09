import * as React from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MediaPickerSelectionTable from './MediaPickerSelectionTable';
import { useLazyListSourcesQuery } from '../../../../app/services/sourceApi';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';

export default function SourceSearchPicker({ platform, queryIndex }) {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyListSourcesQuery();
  const { previewSources } = useSelector((state) => state.query[queryIndex]);

  return (
    <div className="collection-search-picker-container">

      <div className="container">
        <div className="row">

          {/* CollectionSearch */}
          <div className="col-6">
            <TextField
              fullWidth
              label="source name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  trigger({ platform, name: query });
                }
              }}
            />
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
              <MediaPickerSelectionTable
                selected={previewSources}
                matching={data.results}
                onAdd={addPreviewSelectedMedia}
                onRemove={removePreviewSelectedMedia}
                collection={false}
                queryIndex={queryIndex}
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
  queryIndex: PropTypes.number.isRequired,
};
