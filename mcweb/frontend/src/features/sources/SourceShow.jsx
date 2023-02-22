import * as React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

import CollectionList from '../collections/CollectionList';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import StatPanel from '../ui/StatPanel';
import FeedStories from '../feeds/FeedStories';

export default function SourceShow() {
  const params = useParams();
  const sourceId = Number(params.sourceId);

  const {
    data: source,
    isLoading,
  } = useGetSourceQuery(sourceId);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div className="container">

      {(source.platform === 'online_news') && (
        <StatPanel items={[
          { label: 'First Story', value: source.first_story },
          { label: 'Stories per Week', value: source.stories_per_week },
          { label: 'Publication Country', value: source.pub_country },
          { label: 'Publication State', value: source.pub_state },
          { label: 'Primary Language', value: source.primary_language },
          { label: 'Media Type', value: source.media_type },
        ]}
        />
      )}

      <div className="row">
        <div className="col-6">
          <p>
            <b>Homepage</b>
            :
            {' '}
            <a href={source.homepage} target="_blank" rel="noreferrer">{source.homepage}</a>
          </p>
          {source.notes && (
            <p>
              <b>Notes</b>
              {source.notes}
            </p>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <CollectionList sourceId={sourceId} />
        </div>
        {source.platform === 'online_news' && (
          <div className="col-6">
            <FeedStories feed={false} sourceId={sourceId} />
          </div>
        )}
      </div>

    </div>
  );
}
