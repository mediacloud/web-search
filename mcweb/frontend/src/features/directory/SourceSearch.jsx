import * as React from 'react';
import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MediaSearchTable from './MediaSearchTable';
import { useLazyListSourcesQuery } from '../../app/services/sourceApi';

export default function SourceSearch() {
  const [query, setQuery] = useState('');
  const [trigger, {
    isLoading, data,
  }] = useLazyListSourcesQuery();

  return (
    <div className="collection-search-picker-container">

      <div className="container">
        <div className="row">

          {/* SourceSearch */}
          <div className="col-6">
            <TextField
              fullWidth
              label="source name"
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
              <MediaSearchTable
                matching={data.results}
                collection={false}
                isGlobalCollection={false}
              />
            </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
