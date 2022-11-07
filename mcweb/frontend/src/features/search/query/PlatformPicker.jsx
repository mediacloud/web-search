import * as React from 'react';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import YouTubeIcon from '@mui/icons-material/YouTube';
import RedditIcon from '@mui/icons-material/Reddit';
import TwitterIcon from '@mui/icons-material/Twitter';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_TWITTER_TWITTER,
  PROVIDER_YOUTUBE_YOUTUBE,
} from '../util/platforms';

import { closeModal } from '../../ui/uiSlice';
import { setPlatform } from './querySlice';

export default function PlatformPicker() {
  const { platform } = useSelector((state) => state.query);
  const dispatch = useDispatch();

  const handleChangePlatform = (event) => {
    dispatch(setPlatform(event.target.value));
    dispatch(closeModal());
  };

  const [open, setOpen] = useState(true);
  if (platform === 'Choose a Platform') {
    return (
      <div>
        {/* <Button variant="outlined" onClick={handleClickOpen}>
                    Open form dialog
                </Button> */}
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Choose A Platform</DialogTitle>
          <DialogContent>
            <DialogContentText>
              First, Choose a Platform to query against.
            </DialogContentText>
            <Select
              value="Choose A Platform"
              onChange={handleChangePlatform}
            >
              <MenuItem defaultValue disabled value="Choose A Platform">Choose A Platform</MenuItem>
              <MenuItem value={PROVIDER_NEWS_MEDIA_CLOUD}>Online News Archive</MenuItem>
              <MenuItem value={PROVIDER_REDDIT_PUSHSHIFT}>Reddit</MenuItem>
              <MenuItem value={PROVIDER_TWITTER_TWITTER}>Twitter</MenuItem>
              <MenuItem value={PROVIDER_YOUTUBE_YOUTUBE}>Youtube</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12 text-center">
        <div className="query-section">
          <ToggleButtonGroup
            value={platform}
            exclusive
            onChange={handleChangePlatform}
            aria-label="platform"
            color="primary"
          >
            {document.settings.availableProviders.includes(PROVIDER_NEWS_MEDIA_CLOUD) && (
              <ToggleButton value={PROVIDER_NEWS_MEDIA_CLOUD}>
                <NewspaperIcon />
                Online News
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_REDDIT_PUSHSHIFT) && (
              <ToggleButton value={PROVIDER_REDDIT_PUSHSHIFT}>
                <RedditIcon />
                Reddit
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_TWITTER_TWITTER) && (
              <ToggleButton value={PROVIDER_TWITTER_TWITTER}>
                <TwitterIcon />
                Twitter
              </ToggleButton>
            )}
            {document.settings.availableProviders.includes(PROVIDER_YOUTUBE_YOUTUBE) && (
              <ToggleButton value={PROVIDER_YOUTUBE_YOUTUBE}>
                <YouTubeIcon />
                YouTube
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </div>
      </div>
    </div>
  );
}
