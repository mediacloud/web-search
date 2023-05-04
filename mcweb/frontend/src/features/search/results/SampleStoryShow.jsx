import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_NEWS_MEDIA_CLOUD,
} from '../util/platforms';
import { googleFaviconUrl } from '../../ui/uiUtil';
import Permissioned, { ROLE_ADMIN } from '../../auth/Permissioned';

export default function SampleStoryShow({ data, lSTP, platform }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const getStoryId = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 1];
  };
  return (
    <table>
      <tbody>
        <tr>
          <th>Title</th>
          <th>Source</th>
          <th>Publication Date</th>
        </tr>
        {console.log(data)}
        {data.map((sampleStory) => (
          <tr key={sampleStory.id}>
            {console.log(sampleStory)}
            <td>
              <a href={sampleStory.url} target="_blank" rel="noreferrer">
                {sampleStory.title}
              </a>
            </td>
            <td>
              <img
                className="google-icon"
                src={googleFaviconUrl(sampleStory.media_url)}
                alt="{sampleStory.media_name}"
              />
              <a href={sampleStory.media_url} target="_blank" rel="noreferrer">
                {sampleStory.media_name}
              </a>
              
            </td>
            
            <td>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</td>
            
            {[PROVIDER_NEWS_WAYBACK_MACHINE].includes(platform)
              && lSTP === PROVIDER_NEWS_WAYBACK_MACHINE && (
                <td>
                  <Button
                    variant="outlined"
                    onClick={handleClick}
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    endIcon={<KeyboardArrowDownIcon />}
                  >
                    Info
                  </Button>
                  <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem>
                      <a
                        href={sampleStory.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        visit original URL
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <a
                        href={sampleStory.archived_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        visit archived content (on Wayback Machine)
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        to={`/story/${platform}/${getStoryId(
                          sampleStory.article_url,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        view extracted content (from Wayback Machine)
                      </Link>
                    </MenuItem>
                  </Menu>
                </td>
            )}
            {[PROVIDER_NEWS_MEDIA_CLOUD].includes(platform)
              && lSTP === PROVIDER_NEWS_MEDIA_CLOUD && (
                <td>
                  <Permissioned role={ROLE_ADMIN}>
                    <Button
                      variant="outlined"
                      onClick={handleClick}
                      aria-controls={open ? 'basic-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : undefined}
                      endIcon={<KeyboardArrowDownIcon />}
                    >
                      Info
                    </Button>
                  </Permissioned>
                  <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem>
                      <a
                        href={sampleStory.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        view original URL
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        to={`/story/${platform}/${getStoryId(sampleStory.url)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        view extracted content
                      </Link>
                    </MenuItem>
                  </Menu>
                </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

SampleStoryShow.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      archived_url: PropTypes.string,
      article_url: PropTypes.string,
      id: PropTypes.number,
      language: PropTypes.string,
      media_name: PropTypes.string,
      media_url: PropTypes.string,
      publish_date: PropTypes.string,
      title: PropTypes.string,
      url: PropTypes.string,
    }),
  ).isRequired,
  lSTP: PropTypes.string.isRequired,
  platform: PropTypes.string.isRequired,
};
