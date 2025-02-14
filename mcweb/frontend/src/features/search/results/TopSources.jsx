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
import Alert from '@mui/material/Alert';
import BarChart from './BarChart';
import CSVDialog from '../util/CSVDialog';
import TabPanelHelper from '../../ui/TabPanelHelper';
import { useGetTopSourcesMutation } from '../../../app/services/searchApi';
import { SOURCES } from '../util/getDownloadUrl';
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

  const [openDownloadDialog, setopenDownloadDialog] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

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
            <Tabs
              value={value}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="top sources tabs"
            >
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
            // eslint-disable-next-line react/no-array-index-key
            <TabPanelHelper value={value} index={i} key={`top-sources-${i}`}>
              <BarChart
                series={[results]}
                normalized={normalized}
                title="Top Sources"
                height={120 + (results.data.length * 40)}
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
            <CSVDialog
              openDialog={openDownloadDialog}
              queryState={queryState}
              downloadType={SOURCES}
              outsideTitle="Download CSV of Top Sources"
              title="Choose a Query to Download a Top Sources CSV or you can choose to download all queries"
              snackbarText="Top Sources CSV Downloading"
              onClick={() => setopenDownloadDialog(true)}
              variant="outlined"
            />
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
          </h2>
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Examine the sources writing about your topic to understand what media are contributing to coverage.
            Use the  &ldquo;view options&rdquo; menu to switch from story counts to a percentage.
            The percents shown are the percent of all stories matching your query that come from a particular source.
            Please note these percentages are not normalized; therefore, a source that publishes a lower overall volume
            of content will contribute less to your query results, but may still focus proportionately more on the topic.
          </p>
        </div>
        <div className="col-8">
          {content}
        </div>
      </div>
    </div>
  );
}
