import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import { useListFeedStoriesQuery } from '../../app/services/feedsApi';
import { googleFaviconUrl } from '../ui/uiUtil';

function FeedStories({ feedId }) {
  const { data, isLoading } = useListFeedStoriesQuery({ feed_id: feedId });
  if (isLoading) {
    return <CircularProgress size="75px" />;
  }
  if (!data) return null;
  console.log(data);
  // return (<h2>Stories (Coming Soon)</h2>);
  return (
    <div className="results-item-wrapper results-sample-stories">
      <div className="row">
        <div className="col-12">
          <h1 id="feed-story-title">Stories</h1>
        </div>
        <div className="row">

          <div className="col-12">
            <table className="feed-stories">
              <thead>

                <tr className="row">
                  <th className="col-9">Title</th>
                  {/* <th>Source</th> */}
                  <th className="col-3">Publication Date</th>
                </tr>
              </thead>
              <tbody>
                {data.stories.map((sampleStory) => (
                  <tr className="row">
                    <td className="col-10"><a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a></td>
                    {/* <td>
                      <img
                        className="google-icon"
                        src={googleFaviconUrl(sampleStory.domain)}
                        alt={`${sampleStory.domain}`}
                      />
                      <a href={sampleStory.domain} target="_blank" rel="noreferrer">{sampleStory.domain}</a>
                    </td> */}
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
  feedId: PropTypes.number.isRequired,
};

export default FeedStories;
