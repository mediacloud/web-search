import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Settings from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import BarChart from './BarChart';
import TabPanelHelper from '../../ui/TabPanelHelper';
import { useGetTopSourcesMutation } from '../../../app/services/searchApi';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import prepareSourceData from '../util/prepareSourcesData';

export default function TopSources() {
  const queryState = useSelector((state) => state.query);

  const {
    lastSearchTime,
  } = queryState[0];

  const [dispatchQuery, { isLoading, data, error }] = useGetTopSourcesMutation();
  const [newQuery, setNewQuery] = useState(false);

  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [normalized, setNormalized] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const handleDownloadRequest = (qs) => {
    window.location = `/api/search/download-top-sources-csv?qS=${encodeURIComponent(JSON.stringify(prepareQueries(qs)))}`;
  };

  useEffect(() => {
    if (!checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
    }
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

  if (error || !data[0].sources[0]) {
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
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
              {prepareSourceData(data, normalized).map((result, i) => (
                <Tab
                  key={queryTitleArrays[i]}
                  label={queryTitleArrays[i]}
                  id={`simple-tab-${i}`}
                  aria-controls={`simple-tabpanel-${i}`}
                />
              ))}
            </Tabs>
          </Box>

          {prepareSourceData(data, normalized).map((results, i) => (
            <TabPanelHelper value={value} index={i} key={`${results.data[0].value}`}>
              <BarChart
                series={[results]}
                normalized={normalized}
                title="Top Sources"
                height={100 + (results.data.length * 40)}
              />
            </TabPanelHelper>
          ))}
        </Box>

        <div className="clearfix">
          <div className="float-start">
            {normalized && (
            <div>
              <Button
                onClick={handleClick}
                variant="outlined"
                startIcon={
                  <Settings titleAccess="view other chart viewing options" />
                    }
              >
                View Options...
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem
                  onClick={() => {
                    setNormalized(false);
                    handleClose();
                  }}
                >
                  View Story Count
                </MenuItem>
              </Menu>
            </div>
            )}
            {!normalized && (
            <div>
              <Button variant="outlined" onClick={handleClick}>View Options...</Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem
                  onClick={() => {
                    setNormalized(true);
                    handleClose();
                  }}
                >
                  View Normalized Story Percentage (default)
                </MenuItem>
              </Menu>
            </div>
            )}
          </div>

          <div className="float-end">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon titleAccess="Download CSV of Top Languages" />}
              onClick={() => {
                handleDownloadRequest(queryState);
              }}
            >
              Download CSV of Top Sources
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-item-wrapper">
      <div className="row">
        <div className="col-4">
          <h2>
            Top Sources
            {' '}
            <Chip color="warning" label="experimental" />
          </h2>
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Examine the sources writing about your topic to understand what media are contributing to coverage.
            Use the  &ldquo;view options&rdquo; menu to switch from story counts to a percentage.
            The percents shown are the percent of all stories matching your query that come from a particular source.
            Please note these percentages are not normalized; therefore, a source that publishes a lower overall volume
            of content will contribute less to your query results, but may still focus proportionately more on the topic.
          </p>
          {/* {(platform === PROVIDER_REDDIT_PUSHSHIFT) && (
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
          )} */}
          {/* {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
            <p>
              These results are from a sample of titles from 5000 random news stories.
              We use popular software libraries to guess the langage of the extracted text of the articles.
            </p>
          )} */}
        </div>
        <div className="col-8">
          {content}
        </div>
      </div>
    </div>
  );
}
