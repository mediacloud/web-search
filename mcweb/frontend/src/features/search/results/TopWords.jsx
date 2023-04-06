import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DownloadIcon from '@mui/icons-material/Download';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetTopWordsMutation } from '../../../app/services/searchApi';
import checkForBlankQuery from '../util/checkForBlankQuery';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_TWITTER_TWITTER,
} from '../util/platforms';
import queryTitle from '../util/queryTitle';
import prepareQueries from '../util/prepareQueries';
import OrderedWordCloud from './OrderedWordCloud';
import TabPanelHelper from '../../ui/TabPanelHelper';

export default function TopWords() {
  const queryState = useSelector((state) => state.query);

  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  const [dispatchQuery, { isLoading, data, error }] = useGetTopWordsMutation();

  const handleDownloadRequest = (queryObject) => {
    window.location = `/api/search/download-top-words-csv?queryObject=${encodeURIComponent(JSON.stringify(queryObject))}`;
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
                <OrderedWordCloud width={600} color="#000" data={data.words} />
              </TabPanelHelper>
            ))}
          </Box>
        </div>
        <div className="clearfix">
          <div className="float-end">
            {/* <Button
              variant="text"
              endIcon={<DownloadIcon titleAccess="Download CSV of Top Terms" />}
              onClick={() => {
                handleDownloadRequest({
                  query: fullQuery,
                  startDate,
                  endDate,
                  collections: collectionIds,
                  sources,
                  platform,
                });
              }}
            >
              Download CSV of Top Terms
            </Button> */}
          </div>
        </div>

      </>
    );
  }
  return (
    <div className="results-item-wrapper clearfix">
      <div className="row">
        <div className="col-4">
          <h2>
            Top Words
            {' '}
            <Chip color="warning" label="experimental" />
          </h2>
          <p>
            This is an
            {' '}
            <i>experimental</i>
            {' '}
            sample-based list of the top words in content matching your query.
            We have not strongly validated the results as representative. Use at your own risk.
          </p>
          { (platform === PROVIDER_REDDIT_PUSHSHIFT) && (
          <p>
            These results are from a sample titles from top scoring Reddit submissions.
            Common terms (ie. stopwords) have been removed based on the language of each submission.
          </p>
          )}
          { (platform === PROVIDER_TWITTER_TWITTER) && (
          <p>
            These results are from a sample of the text from the most recent Tweets.
            Common terms (ie. stopwords) have been removed based on the language of each Tweet.
          </p>
          )}
          { (platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
          <p>
            These results are from a sample of titles from 5000 random news stories.
            Common terms (ie. stopwords) from languages that have more than 15% of the results have been removed.
          </p>
          )}
        </div>
        <div className="col-8">
          { content }
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
