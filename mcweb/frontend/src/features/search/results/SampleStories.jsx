import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSampleStoriesMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_MEDIA_CLOUD,
  PROVIDER_TWITTER_TWITTER, PROVIDER_YOUTUBE_YOUTUBE,
} from '../util/platforms';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import SampleStoryShow from './SampleStoryShow';
import tabTitle from '../util/tabTitle';
import TabPanelHelper from '../../ui/TabPanelHelper';
import createNonUniqueKey from '../util/createNonUniqueKey';

export default function SampleStories() {
  const queryState = useSelector((state) => state.query);
  const {
    platform,
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
  const [newQuery, setNewQuery] = useState(false);

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

  useEffect(() => {
    if (!checkForBlankQuery(queryState) && queryState.length === 1) {
      setNewQuery(true);
    } else {
      setNewQuery(false);
    }
  }, [lastSearchTime, queryState.length]);

  if (newQuery) return null;

  if (isLoading) {
    return (<div><CircularProgress size="75px" /></div>);
  }

  let content;
  if (!data && !error) return null;
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
    const queryTitleArrays = queryState.map((query, index) => tabTitle(queryState, index));

    content = (
      <div className="container">
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
              {data.sample.map((result, i) => (
                <Tab key={createNonUniqueKey(result, i)} label={queryTitleArrays[i]} {...a11yProps(i)} />
              ))}
            </Tabs>
          </Box>

          {data.sample.map((results, i) => (
            <TabPanelHelper key={createNonUniqueKey(results, i)} value={value} index={i}>
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
          {(platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
            <p>
              These results are a random sample of news stories that matched your searches.
            </p>
          )}
          {(platform === PROVIDER_REDDIT_PUSHSHIFT) && (
            <p>
              These results are the top scoring Reddit submissions that matched your
              searches.
            </p>
          )}
          {(platform === PROVIDER_TWITTER_TWITTER) && (
            <p>
              These results are the most recent tweets that matched your searches.
            </p>
          )}
          {(platform === PROVIDER_YOUTUBE_YOUTUBE) && (
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
