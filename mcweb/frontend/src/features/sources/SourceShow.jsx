import * as React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import buildStatArray from './util/buildStatArray';
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
        <StatPanel items={buildStatArray(source)} />
      )}

      <div className="row">
        <div className="col-6">
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Homepage</b>: <a href={source.homepage} target="_blank" rel="noreferrer">{source.homepage}</a>
          </p>
          {source.url_search_string && (
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>URL Search String</b>: {source.url_search_string}
          </p>
          )}
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
