import * as React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import CollectionList from '../collections/CollectionList';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import StatPanel from '../ui/StatPanel';

export default function SourceShow() {
  const params = useParams();
  const sourceId = Number(params.sourceId);

  const location = useLocation();
  const {
    data,
    isLoading,
  } = useGetSourceQuery(sourceId);

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
      <div className="container">
        
        { data.notes && (
          <div class="row">
            <div class="col-6">
              <p>{data.notes}</p>
            </div>
          </div>
        )}

        <StatPanel items={[
          { label: 'First Story', value: data.first_story },
          { label: 'Stories per Week', value: data.stories_per_week },
          { label: 'Publication Country', value: data.pub_country },
          { label: 'Publication State', value: data.pub_state },
          { label: 'Primary Language', value: data.primary_language },
          { label: 'Media Type', value: data.media_type },
        ]}
        />

        <div className="row">
          <div className="col-6">
            <CollectionList sourceId={sourceId} />
          </div>
        </div>

      </div>
  );
}
