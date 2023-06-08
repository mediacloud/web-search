import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import BarChart from './BarChart';
import TabPanelHelper from '../../ui/TabPanelHelper';
import { useGetTopLanguagesMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_TWITTER_TWITTER,
} from '../util/platforms';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import prepareLanguageData from '../util/prepareLanguageData';
import tabTitle from '../util/tabTitle';
import createNonUniqueKey from '../util/createNonUniqueKey';

export default function TopLanguages() {
  const queryState = useSelector((state) => state.query);

  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  const [dispatchQuery, { isLoading, data, error }] = useGetTopLanguagesMutation();
  const [newQuery, setNewQuery] = useState(false);

  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleDownloadRequest = (qs) => {
    window.location = `/api/search/download-top-languages-csv?qS=${encodeURIComponent(JSON.stringify(prepareQueries(qs)))}`;
  };

  useEffect(() => {
    if (checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
    }
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
      <>
        <div className="container">
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                {prepareLanguageData(data).map((result, i) => (
                  <Tab
                    key={createNonUniqueKey(result, i)}
                    label={queryTitleArrays[i]}
                    id={`simple-tab-${i}`}
                    aria-controls={`simple-tabpanel-${i}`}
                  />
                ))}
              </Tabs>
            </Box>

            {prepareLanguageData(data).map((results, i) => (
              <TabPanelHelper key={createNonUniqueKey(results, i)} value={value} index={i}>
                <BarChart
                  series={[results]}
                  normalized
                  title="Top Languages"
                  height={100 + (results.data.length * 40)}
                />
              </TabPanelHelper>
            ))}
          </Box>
        </div>
        <div className="clearfix">
          <div className="float-end">
            <Button
              variant="text"
              endIcon={<DownloadIcon titleAccess="Download CSV of Top Languages" />}
              onClick={() => {
                handleDownloadRequest(queryState);
              }}
            >
              Download CSV of Top Languages
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="results-item-wrapper">
      <div className="row">
        <div className="col-4">
          <h2>
            Top Languages
            {' '}
            <Chip color="warning" label="experimental" />
          </h2>
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            This is an<i> experimental </i>
            sample-based list of the top languages of content matching your query.
            We have not strongly validated the results as representative. Use at your own risk.
          </p>
          {(platform === PROVIDER_REDDIT_PUSHSHIFT) && (
            <p>
              These results are from a sample of titles of top scoring Reddit submissions. Reddit provieds
              the language of the submission.
            </p>
          )}
          {(platform === PROVIDER_TWITTER_TWITTER) && (
            <p>
              These results are from a sample of the text from the most recent Tweets.
              Twitter provides the language of the submission.
            </p>
          )}
          {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
            <p>
              These results are from a sample of titles from 5000 random news stories.
              We use popular software libraries to guess the langage of the extracted text of the articles.
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
