import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSampleStoriesMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_REDDIT_PUSHSHIFT,
  PROVIDER_TWITTER_TWITTER, PROVIDER_YOUTUBE_YOUTUBE,
} from '../util/platforms';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import SampleStoryShow from './SampleStoryShow';
import queryTitle from '../util/queryTitle';
import TabPanelHelper from '../../ui/TabPanelHelper';

export default function SampleStories() {
  const queryState = useSelector((state) => state.query);
  const {
    platform,
    startDate,
    endDate,
    lastSearchTime,
  } = queryState[0];

  const [lastSearchTimePlatform, setLastSearchTimePlatform] = useState(platform);

  const [dispatchQuery, { isLoading, data, error }] = useGetSampleStoriesMutation();

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

  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
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
        <div className="container">
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                {data.sample.map((result, i) => (
                  <Tab label={queryTitle(queryState, i)} {...a11yProps(i)} />
                ))}
              </Tabs>
            </Box>

            {data.sample.map((results, i) => (
              <TabPanelHelper value={value} index={i}>
                <SampleStoryShow
                  open={open}
                  data={results}
                  lSTP={lastSearchTimePlatform}
                  handleClick={handleClick}
                  handleClose={handleClose}
                  platform={platform}
                />
              </TabPanelHelper>
            ))}
          </Box>
        </div>
        {/* <div className="clearfix">
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
        </div> */}
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

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
