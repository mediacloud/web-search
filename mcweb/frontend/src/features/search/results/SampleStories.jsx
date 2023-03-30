import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { useGetSampleStoriesMutation } from '../../../app/services/searchApi';
import queryGenerator from '../util/queryGenerator';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD,
  PROVIDER_TWITTER_TWITTER, PROVIDER_YOUTUBE_YOUTUBE,
} from '../util/platforms';
import { googleFaviconUrl } from '../../ui/uiUtil';

export default function SampleStories() {
  const {
    queryList,
    queryString,
    negatedQueryList,
    platform,
    startDate,
    endDate,
    collections,
    sources,
    lastSearchTime,
    anyAll,
    advanced,
  } = useSelector((state) => state.query);

  const [lastSearchTimePlatform, setLastSearchTimePlatform] = useState(platform);

  const fullQuery = queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const [query, { isLoading, data, error }] = useGetSampleStoriesMutation();

  const collectionIds = collections.map((c) => c.id);
  const sourceIds = sources.map((s) => s.id);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadRequest = (queryObject) => {
    window.location = `/api/search/download-all-content-csv?queryObject=${encodeURIComponent(JSON.stringify(queryObject))}`;
  };

  const getStoryId = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[(parts.length - 1)];
  };

  useEffect(() => {
    if ((queryList[0].length !== 0 || (advanced && queryString !== 0))) {
      query({
        query: fullQuery,
        startDate,
        endDate,
        collections: collectionIds,
        sources: sourceIds,
        platform,

      });
    }
    setLastSearchTimePlatform(platform);
  }, [lastSearchTime]);

  if (isLoading) {
    return (<div><CircularProgress size="75px" /></div>);
  }

  if ((data === undefined) && (error === undefined)) {
    return null;
  }

  let content;
  if (error) {
    // const msg = data.note;
    content = (
      <Alert severity="warning">
        Sorry, but something went wrong.
        (
        {error.data.note}
        )
      </Alert>
    );
  } else {
    content = (
      <>
        <table>
          <tbody>
            <tr>
              <th>Title</th>
              <th>Source</th>
              <th>Publication Date</th>
            </tr>
            {data.sample.map((sampleStory) => (
              <tr key={`story-${sampleStory.id}`}>
                <td><a href={sampleStory.url} target="_blank" rel="noreferrer">{sampleStory.title}</a></td>
                <td>
                  <img
                    className="google-icon"
                    src={googleFaviconUrl(sampleStory.media_url)}
                    alt="{sampleStory.media_name}"
                  />
                  <a href={sampleStory.media_url} target="_blank" rel="noreferrer">{sampleStory.media_name}</a>
                </td>
                <td>{dayjs(sampleStory.publish_date).format('MM-DD-YY')}</td>
                {([PROVIDER_NEWS_WAYBACK_MACHINE].includes(platform)
                && lastSearchTimePlatform === PROVIDER_NEWS_WAYBACK_MACHINE) && (

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
                    <Menu
                      anchorEl={anchorEl}
                      open={open}
                      onClose={handleClose}
                    >
                      <MenuItem>
                        <a href={sampleStory.url} target="_blank" rel="noreferrer">
                          visit original URL
                        </a>
                      </MenuItem>
                      <MenuItem>
                        <a href={sampleStory.archived_url} target="_blank" rel="noreferrer">
                          visit archived content (on Wayback Machine)
                        </a>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          to={`/story/${platform}/${getStoryId(sampleStory.article_url)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          view extracted content (from Wayback Machine)
                        </Link>
                      </MenuItem>
                    </Menu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="clearfix">
          <div className="float-end">
            <Button
              variant="text"
              endIcon={<DownloadIcon titleAccess="download a CSV of all matching content" />}
              onClick={() => {
                handleDownloadRequest({
                  query: fullQuery,
                  startDate,
                  endDate,
                  collections: collectionIds,
                  sources: sourceIds,
                  platform,
                });
              }}
            >
              Download CSV of All Content
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="results-item-wrapper clearfix">
      <div className="row">
        <div className="col-4">
          <h2>Sample Content</h2>
          <p>
            This is a sample of the content that matched your queries.
            Click the menu on the bottom  right to download a CSV of all the
            matching content and associated metadata.
          </p>
          { (platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
          <p>
            These results are a random sample of news stories that matched your searches.
          </p>
          )}
          { (platform === PROVIDER_REDDIT_PUSHSHIFT) && (
          <p>
            These results are the top scoring Reddit submissions that matched your
            searches.
          </p>
          )}
          { (platform === PROVIDER_TWITTER_TWITTER) && (
          <p>
            These results are the most recent tweets that matched your searches.
          </p>
          )}
          { (platform === PROVIDER_YOUTUBE_YOUTUBE) && (
          <p>
            These results are the most viewed videos that matched your searches.
          </p>
          )}
        </div>
        <div className="col-8">
          {content}
        </div>
      </div>
    </div>
  );
}
