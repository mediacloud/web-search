import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import BarChart from './BarChart';
import CSVDialog from '../util/CSVDialog';
import { LANG } from '../util/getDownloadUrl';
import TabPanelHelper from '../../ui/TabPanelHelper';
import { useGetTopLanguagesMutation } from '../../../app/services/searchApi';
import { PROVIDER_NEWS_WAYBACK_MACHINE } from '../util/platforms';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import prepareLanguageData from '../util/prepareLanguageData';

export default function TopLanguages() {
  const queryState = useSelector((state) => state.query);

  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  const [dispatchQuery, { isLoading, data, error }] = useGetTopLanguagesMutation();
  const [newQuery, setNewQuery] = useState(false);

  const [openDownloadDialog, setopenDownloadDialog] = useState(false);

  const [value, setValue] = useState(0);
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

  if (error || !data[0].languages[0]) {
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
                aria-label="languages tabs"
              >
                {prepareLanguageData(data).map((result, i) => (
                  <Tab
                    key={queryTitleArrays[i]}
                    label={queryTitleArrays[i]}
                    id={`simple-tab-${i}`}
                    aria-controls={`simple-tabpanel-${i}`}
                  />
                ))}
              </Tabs>
            </Box>

            {prepareLanguageData(data).map((results, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <TabPanelHelper value={value} index={i} key={`top-language-${i}`}>
                <BarChart
                  series={[results]}
                  normalized
                  title="Top Languages"
                  height={120 + (results.data.length * 40)}
                />
              </TabPanelHelper>
            ))}
          </Box>
        </div>
        <div className="clearfix">
          <div className="float-end">
            <CSVDialog
              openDialog={openDownloadDialog}
              queryState={queryState}
              downloadType={LANG}
              outsideTitle="Download CSV of Top Languages"
              title="Choose a Query to Download a Top Languages CSV or you can choose to download all queries"
              snackbarText="Top Languages CSV Downloading"
              onClick={() => setopenDownloadDialog(true)}
              variant="outlined"
            />
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
          </h2>
          <p>
            This is a sample-based list of the top languages of content matching your query.
          </p>
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
