import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import {
  PROVIDER_NEWS_MEDIA_CLOUD,
  PROVIDER_NEWS_WAYBACK_MACHINE,
} from '../search/util/platforms';

export default function InfoMenu({ platform, sampleStory }) {
  const getStoryId = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[(parts.length - 1)];
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <td>
      <div>
        <Button
          id="positioned-button"
          aria-controls={open ? 'positioned-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          Info
        </Button>

        <Menu
          id="positioned-button"
          aria-labelledby="positioned-button"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <div className="menu">
            {/* Original URL is the same for both media-cloud and wayback-machine */}
            <a
              href={sampleStory.url}
              target="_blank"
              rel="noreferrer"
              onClick={handleClose}
              className="menu-item"
            >
              Visit original URL
            </a>

            {/* wayback-machine only has an archived url */}
            {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
              <a
                href={sampleStory.archived_url}
                target="_blank"
                rel="noreferrer"
                onClick={handleClose}
                className="menu-item"
              >
                Visit archived content (on Wayback Machine)
              </a>
            )}

            {/* {(platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
            <a
              href={sampleStory.url}
              target="_blank"
              rel="noreferrer"
              onClick={handleClose}
              className="menu-item"
            >
              Visit archived content (on Wayback Machine)
            </a>
            )} */}

            {/* media-cloud story is a bit different, taken out of id */}
            {(platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
              <NavLink
                to={`/story/${platform}/${encodeURIComponent(sampleStory.url)}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleClose}
                className="menu-item"
              >
                View extracted content (from Media Cloud)
              </NavLink>
            )}

            {/* wayback-machine story id is taken out of getStoryId function  */}
            {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
              <NavLink
                to={`/story/${platform}/${getStoryId(sampleStory.article_url)}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleClose}
                className="menu-item"
              >
                View extracted content (from Wayback Machine)
              </NavLink>
            )}
          </div>
        </Menu>
      </div>
    </td>
  );
}

InfoMenu.propTypes = {
  sampleStory: PropTypes.shape({
    archived_url: PropTypes.string,
    article_url: PropTypes.string,
    id: PropTypes.string,
    language: PropTypes.string,
    media_name: PropTypes.string,
    media_url: PropTypes.string,
    publish_date: PropTypes.string,
    title: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  platform: PropTypes.string.isRequired,
};
