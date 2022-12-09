import * as React from 'react';
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';
import TwitterIcon from '@mui/icons-material/Twitter';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_TWITTER_TWITTER,
  PROVIDER_YOUTUBE_YOUTUBE, PROVIDER_NEWS_WAYBACK_MACHINE,
} from '../util/platforms';

import { setPlatform } from './querySlice';

export default function PlatformPicker() {
  const { platform } = useSelector((state) => state.query);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const handleChangePlatform = (event) => {
    dispatch(setPlatform(event.target.value));
    enqueueSnackbar('We removed your collections', { variant: 'warning' });
  };

  return (
    <div className="row">
      <div className="col-12 text-center">
        <div className="query-section platform-picker">
          <ToggleButtonGroup
            value={platform}
            exclusive
            onChange={handleChangePlatform}
            aria-label="platform"
            color="primary"
          >
            {document.settings.availableProviders.includes(PROVIDER_NEWS_WAYBACK_MACHINE) && (
              <ToggleButton value={PROVIDER_NEWS_WAYBACK_MACHINE}>
                <NewspaperIcon fontSize="large" />
                Online News
                <br />
                (Wayback Machine)
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_NEWS_MEDIA_CLOUD) && (
              <ToggleButton value={PROVIDER_NEWS_MEDIA_CLOUD}>
                <NewspaperIcon fontSize="large" />
                Online News
                <br />
                (Media Cloud)
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_REDDIT_PUSHSHIFT) && (
              <ToggleButton value={PROVIDER_REDDIT_PUSHSHIFT}>
                <RedditIcon fontSize="large" />
                Reddit
                <br />
                (PushShift.io API)
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_TWITTER_TWITTER) && (
              <ToggleButton value={PROVIDER_TWITTER_TWITTER}>
                <TwitterIcon fontSize="large" />
                Twitter
                <br />
                (Twitter API)
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_YOUTUBE_YOUTUBE) && (
              <ToggleButton value={PROVIDER_YOUTUBE_YOUTUBE}>
                <YouTubeIcon fontSize="large" />
                YouTube
                <br />
                (YouTube API)
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </div>
      </div>
    </div>
  );
}
