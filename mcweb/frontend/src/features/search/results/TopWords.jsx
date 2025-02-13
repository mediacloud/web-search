import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetTopWordsMutation } from '../../../app/services/searchApi';
import checkForBlankQuery from '../util/checkForBlankQuery';
import CSVDialog from '../util/CSVDialog';
import { WORDS } from '../util/getDownloadUrl';
import { PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD } from '../util/platforms';
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

  const [value, setValue] = useState(0);
  const [newQuery, setNewQuery] = useState(false);

  const [openDownloadDialog, setopenDownloadDialog] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
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

  if (error || !data[0].words[0]) {
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
      <>
        <div className="container">
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="top words tabs"
              >
                {data.map((result, i) => (
                  <Tab
                    key={queryTitleArrays[i]}
                    label={queryTitleArrays[i]}
                    id={`simple-tab-${i}`}
                    aria-controls={`simple-tabpanel-${i}`}
                  />
                ))}

              </Tabs>
            </Box>
            {data.map((results, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <TabPanelHelper value={value} index={i} key={`words-key-${i}`}>
                <OrderedWordCloud width={600} color="#000" data={results.words} />
              </TabPanelHelper>
            ))}
          </Box>
        </div>
        <div className="clearfix">
          <div className="float-end">
            <CSVDialog
              openDialog={openDownloadDialog}
              queryState={queryState}
              downloadType={WORDS}
              outsideTitle="Download CSV of Top Terms"
              title="Choose a Query to Download a Top Terms CSV or you can choose to download all queries"
              snackbarText="Top Words CSV Downloading"
              onClick={() => setopenDownloadDialog(true)}
              variant="outlined"
            />
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
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Top Words <Chip color="warning" label="experimental" />
          </h2>
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            This is an<i> experimental </i>
            sample-based list of the top words in headlines of content matching your query.
            We have not strongly validated the results as representative. Use at your own risk.
          </p>
          {(platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
            <p>
              These results are from a random sample of titles from news stories.
            </p>
          )}
          {(platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
            <p>
              These results are from a sample of titles from 5000 random news stories.
              Common terms (ie. stopwords) from languages that have more than 15% of the results have been removed.
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
