import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import dayjs from 'dayjs';
import { useGetStoryDetailsQuery } from '../../app/services/searchApi';
import {
  PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE,
} from '../search/util/platforms';
import { ROLE_STAFF, PermissionedStaff } from '../auth/Permissioned';

export default function StoryShow() {
  const params = useParams();
  const { storyURL, platform } = params;

  const { data, isLoading } = useGetStoryDetailsQuery({ storyId: storyURL, platform });

  const [platformName, setPlatformName] = useState('');

  useEffect(() => {
    if (platform === PROVIDER_NEWS_MEDIA_CLOUD) {
      setPlatformName('Media Cloud');
    } else {
      setPlatformName('Wayback Machine');
    }
  }, [platform]);

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
          Extracted story information provided by
          {' '}
          {platformName}
        </Alert>
      </div>

      <div className="row">
        {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
          <h5>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Originally published on {dayjs(story.publication_date).format('MM/DD/YYYY')}
            {' '}
            in
            {' '}
            <b>{story.domain}</b>
            . Collected on
            {' '}
            {dayjs(story.capture_time).format('MM/DD/YYYY')}
            .
          </h5>
        )}

        {(platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
          <h5>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Originally published on {dayjs(story.publish_date).format('MM/DD/YYYY')} in <b>{story.media_name}</b>
          </h5>
        )}
      </div>

      {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
        <div>
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
      )}
      <PermissionedStaff role={ROLE_STAFF}>
        <p>{story.text}</p>
      </PermissionedStaff>

    </div>
  );
}
