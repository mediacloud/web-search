import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import BarChart from './BarChart';
import queryGenerator from '../util/queryGenerator';
import { useGetTopLanguagesMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_TWITTER_TWITTER,
} from '../util/platforms';

export default function TopLanguages() {
  const {
    queryString,
    queryList,
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

  const fullQuery = queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const [query, { isLoading, data, error }] = useGetTopLanguagesMutation();

  const collectionIds = collections.map((c) => c.id);
  const sourceIds = sources.map((s) => s.id);

  const handleDownloadRequest = (queryObject) => {
    window.location = `/api/search/download-top-languages-csv?queryObject=${encodeURIComponent(JSON.stringify(queryObject))}`;
  };

  useEffect(() => {
    if ((queryList[0].length !== 0) || (advanced && queryString !== 0)) {
      query({
        query: fullQuery,
        startDate,
        endDate,
        collections: collectionIds,
        sources: sourceIds,
        platform,
      });
    }
  }, [lastSearchTime]);

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
    content = (
      <>
        <BarChart
          series={[{
            data: data.languages.map((l) => ({
              key: l.language, value: l.ratio * 100,
            })),
            name: 'Language',
            color: '#2f2d2b',
          }]}
          normalized
          title="Top Languages"
          height={100 + (data.languages.length * 40)}
        />
        <div className="clearfix">
          <div className="float-end">
            <Button
              variant="text"
              endIcon={<DownloadIcon titleAccess="Download CSV of Top Languages" />}
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
            This is an
            {' '}
            <i>experimental</i>
            {' '}
            sample-based list of the top languages of content matching your query.
            We have not strongly validated the results as representative. Use at your own risk.
          </p>
          { (platform === PROVIDER_REDDIT_PUSHSHIFT) && (
          <p>
            These results are from a sample of titles of top scoring Reddit submissions. Reddit provieds
            the language of the submission.
          </p>
          )}
          { (platform === PROVIDER_TWITTER_TWITTER) && (
          <p>
            These results are from a sample of the text from the most recent Tweets.
            Twitter provides the language of the submission.
          </p>
          )}
          { (platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
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
