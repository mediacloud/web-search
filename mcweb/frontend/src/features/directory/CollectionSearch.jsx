import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useLazyListCollectionsQuery } from '../../app/services/collectionsApi';
import MediaSearchTable from './MediaSearchTable';

export default function CollectionSearch() {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyListCollectionsQuery();

  return (
    <div className="collection-search-picker-container">

      <div className="container">
        <div className="row">

          {/* CollectionSearch */}
          <div className="col-6">
            <TextField
              fullWidth
              label="collection name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  trigger({ name: query });
                }
              }}
            />
          </div>
          <div className="col-6">
            <Button size="large" variant="contained" onClick={() => trigger({ name: query })}>
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
                <MediaSearchTable
                  matching={data.results}
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
