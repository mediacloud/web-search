import React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useGetStoryDetailsQuery } from '../../app/services/searchApi';

export default function StoryShow() {
  const params = useParams();
  const { storyId } = params;
  const { data, isLoading } = useGetStoryDetailsQuery(storyId);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  if (!data) return null;

  const { story } = data;
  return (
    <div className="container" style={{ paddingTop: 50 }}>
      <h1 className="row">{story.title}</h1>
      <div className="row">
        <h5>
          Originally published on
          {' '}
          {story.publication_date}
          {' '}
          in
          {' '}
          <b>
            {story.domain}
          </b>
          . Collected on
          {' '}
          {story.capture_time}
          .
        </h5>
      </div>

      <div className="clearfix">
        <h3 className="float-start">Story Text</h3>
        <h6 className="float-end">
          {' '}
          <a target="_blank" href={story.archive_playback_url} rel="noreferrer">
            <OpenInNewIcon />
          </a>
        </h6>

      </div>
      <p className="row">{story.snippet}</p>
    </div>
  );
}
