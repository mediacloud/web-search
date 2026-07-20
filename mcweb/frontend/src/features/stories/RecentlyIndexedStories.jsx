import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetRecentlyIndexedStoriesQuery } from '../../app/services/searchApi';
import {
  PROVIDER_NEWS_MEDIA_CLOUD,
  earliestAllowedStartDate,
  latestAllowedEndDate,
} from '../search/util/platforms';

export default function RecentlyIndexedStories({ sourceId }) {
  const { data, isLoading } = useGetRecentlyIndexedStoriesQuery({
    sourceId,
    startDate: earliestAllowedStartDate(PROVIDER_NEWS_MEDIA_CLOUD).format('YYYY-MM-DD'),
    endDate: latestAllowedEndDate(PROVIDER_NEWS_MEDIA_CLOUD).format('YYYY-MM-DD'),
  });

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }
  if (!data) return null;

  return (
    <div className="results-item-wrapper results-sample-stories">
      <div className="row">
        <div className="col-12">
          <h1>Recently Indexed Stories</h1>
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
                {data.stories.map((story) => (
                  <tr key={story.id || story.url} className="row">
                    <td className="col-10"><a href={story.url} target="_blank" rel="noreferrer">{story.title}</a></td>
                    <td className="col-2">{dayjs(story.publish_date).format('MM-DD-YY')}</td>
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

RecentlyIndexedStories.propTypes = {
  sourceId: PropTypes.number.isRequired,
};
