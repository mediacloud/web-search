import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import { useListStoriesQuery } from '../../app/services/feedsApi';

function FeedStories({ feedId, feed, sourceId }) {
  const { data, isLoading } = useListStoriesQuery(feed ? { feed_id: Number(feedId) } : { source_id: Number(sourceId) });
  if (isLoading) {
    return <CircularProgress size="75px" />;
  }
  if (!data) return null;

  return (
    <div className="results-item-wrapper results-sample-stories">
      <div className="row">
        <div className="col-12">
          <h1 id="feed-story-title">Latest Stories</h1>
        </div>
        <div className="row">

          <div className="col-12">
            <table className="feed-stories">
              <thead>

                <tr className="row">
                  <th className="col-9">Title</th>
                  <th className="col-3">Publication Date</th>
                </tr>
              </thead>
              <tbody>
                {data.stories.map((sampleStory) => (
                  <tr key={sampleStory.url} className="row">
                    <td className="col-10"><a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a></td>
                    <td className="col-2">{dayjs(sampleStory.published_at).format('MM-DD-YY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

FeedStories.propTypes = {
  feedId: PropTypes.number,
  feed: PropTypes.bool.isRequired,
  sourceId: PropTypes.number,
};

FeedStories.defaultProps = {
  sourceId: null,
  feedId: null,
};

export default FeedStories;
