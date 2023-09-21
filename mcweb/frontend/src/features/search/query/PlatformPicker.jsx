import * as React from 'react';
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';
import TwitterIcon from '@mui/icons-material/Twitter';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import addType from './media-picker/util/addType';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_TWITTER_TWITTER, PROVIDER_NEWS_MEDIA_CLOUD,
  PROVIDER_YOUTUBE_YOUTUBE, PROVIDER_NEWS_WAYBACK_MACHINE,
} from '../util/platforms';

import {
  resetSelectedAndPreviewMedia, addSelectedMedia, setPlatform,
} from './querySlice';

export default function PlatformPicker({ queryIndex }) {
  const { platform, collections, sources, previewCollections, previewSources } = useSelector((state) => state.query[queryIndex]);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const providersOfSamePlatform = (provider1, provider2) => provider1.split('-')[0] === provider2.split('-')[0];

  const handleChangePlatform = (newPlatform) => {
    dispatch(setPlatform(newPlatform));
    const hasSomeMedia = (collections.length + sources.length) > 0;
    const samePlatform = platform && newPlatform ? providersOfSamePlatform(platform, newPlatform) : null;
    /*
    hasSomeMedia && samePlatform: nothing
    !hasSomeMedia && samePlatform: nothing
    hasSomeMedia && !samePlatform: reset
    !hasSomeMedia && !samePlatform: if to online_news set to news_default else reset
    */
    if (!samePlatform) {
      if (!hasSomeMedia) {
        if ([PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD].includes(newPlatform)) {
          dispatch(addSelectedMedia({ sourceOrCollection: addType(previewSources, previewCollections), queryIndex }));
          enqueueSnackbar('We reset your collections to work with this platform.', { variant: 'warning' });
        } else {
          dispatch(resetSelectedAndPreviewMedia({ queryIndex }));
          enqueueSnackbar("We removed your collections because they don't work with this platform.", { variant: 'warning' });
        }
      } else {
        dispatch(resetSelectedAndPreviewMedia({ queryIndex }));
        enqueueSnackbar("We removed your collections because they don't work with this platform.", { variant: 'warning' });
      }
    }
  };

  return (
    <div className="row">
      <div className="col-12 text-center">
        <div className="query-section platform-picker">
          <ToggleButtonGroup
            value={platform}
            exclusive
            aria-label="platform"
            color="primary"
          >

            {document.settings.availableProviders.includes(PROVIDER_NEWS_MEDIA_CLOUD) && (
              <ToggleButton onClick={() => { handleChangePlatform(PROVIDER_NEWS_MEDIA_CLOUD); }}>
                <NewspaperIcon fontSize="large" />
                Online News
                <br />
                (Media Cloud)
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_NEWS_WAYBACK_MACHINE) && (
              <ToggleButton onClick={() => { handleChangePlatform(PROVIDER_NEWS_WAYBACK_MACHINE); }}>
                <NewspaperIcon fontSize="large" />
                Online News
                <br />
                (Wayback Machine)
              </ToggleButton>
            )}
            {/* {document.settings.availableProviders.includes(PROVIDER_REDDIT_PUSHSHIFT) && (
              <ToggleButton
                onClick={() => { handleChangePlatform(PROVIDER_REDDIT_PUSHSHIFT); }}
                value={PROVIDER_REDDIT_PUSHSHIFT}
              >
                <RedditIcon fontSize="large" />
                Reddit
                <br />
                (PushShift.io API)
              </ToggleButton>
            )} */}
            {/* {document.settings.availableProviders.includes(PROVIDER_TWITTER_TWITTER) && (
              <ToggleButton
                onClick={() => { handleChangePlatform(PROVIDER_TWITTER_TWITTER); }}
                value={PROVIDER_TWITTER_TWITTER}
              >
                <TwitterIcon fontSize="large" />
                Twitter
                <br />
                (Twitter API)
              </ToggleButton>
            )} */}
            {document.settings.availableProviders.includes(PROVIDER_YOUTUBE_YOUTUBE) && (
              <ToggleButton onClick={() => { handleChangePlatform(PROVIDER_YOUTUBE_YOUTUBE); }}>
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

PlatformPicker.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
