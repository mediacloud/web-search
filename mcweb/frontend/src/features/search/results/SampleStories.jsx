import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSampleStoriesMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_NEWS_MEDIA_CLOUD,
} from '../util/platforms';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import SampleStoryShow from './SampleStoryShow';
import TabPanelHelper from '../../ui/TabPanelHelper';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function SampleStories() {
  const queryState = useSelector((state) => state.query);
  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  const [lastSearchTimePlatform, setLastSearchTimePlatform] = useState(platform);

  const [dispatchQuery, { isLoading, data, error }] = useGetSampleStoriesMutation();

  const [newQuery, setNewQuery] = useState(false);

  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (!checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
    }
    setLastSearchTimePlatform(platform);
  }, [lastSearchTime]);

  useEffect(() => {
    if (checkForBlankQuery(queryState) && queryState.length === 1) {
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

  if (error || !data[0].sample[0]) {
    content = (
      <Alert severity="warning">
        Sorry, but something went wrong.
        (
        {error ? error.note : 'No results please try a different query'}
        )
      </Alert>
    );
  } else {
    const queryTitleArrays = queryState.map((query, index) => queryState[index].name);

    content = (
      <div className="container">
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="sample stories tab"
            >
              {data.map((result, i) => (
                <Tab
                  key={queryTitleArrays[i]}
                  label={queryTitleArrays[i]}
                // eslint-disable-next-line react/jsx-props-no-spreading
                  {...a11yProps(i)}
                />
              ))}
            </Tabs>
          </Box>

          {data.map((results, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <TabPanelHelper value={value} index={i} key={`$sample-story-${i}`}>
              <SampleStoryShow
                data={results.sample}
                lSTP={lastSearchTimePlatform}
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
          </p>
          {(platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
            <p>
              These results are a random sample of news stories that matched your searches.
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
