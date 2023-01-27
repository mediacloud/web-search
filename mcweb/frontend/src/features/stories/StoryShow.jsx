import React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
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
      <div className="row">
        <h1>{story.title}</h1>
      </div>
      <div className="row" style={{ marginLeft: 1 }}>
        <Alert severity="info" sx={{ width: '40%', marginBottom: 2 }}>
          Extracted story information provided by Wayback Machine
        </Alert>
      </div>

      <div className="row">
        <h5>
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          Originally published on {story.publication_date} in <b>{story.domain}</b>. Collected on {story.capture_time}.
        </h5>
      </div>

      <div className="clearfix">
        <h3 className="float-start">Story Text</h3>
        <h6 className="float-end">
          <a target="_blank" href={story.archive_playback_url} rel="noreferrer">
            <OpenInNewIcon />
          </a>
        </h6>

      </div>
      <div className="row">
        <p>{story.snippet}</p>
      </div>
    </div>
  );
}
