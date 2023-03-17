import * as React from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetTopWordsMutation } from '../../../app/services/searchApi';
import queryGenerator from '../util/queryGenerator';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_TWITTER_TWITTER, PROVIDER_NEWS_MEDIA_CLOUD,
} from '../util/platforms';
import OrderedWordCloud from './OrderedWordCloud';

export default function TopWords() {
  const {
    queryList,
    queryString,
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

  const [query, { isLoading, data, error }] = useGetTopWordsMutation();

  const collectionIds = collections.map((collection) => collection.id);

  const handleDownloadRequest = (queryObject) => {
    window.location = `/api/search/download-top-words-csv?queryObject=${encodeURIComponent(JSON.stringify(queryObject))}`;
  };

  useEffect(() => {
    if ((queryList[0].length !== 0 || (advanced && queryString !== 0))) {
      query({
        query: fullQuery,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,

      });
    }
  }, [lastSearchTime]);

  if (isLoading) {
    return (<div><CircularProgress size="75px" /></div>);
  }

  if ((data === undefined) && (error === undefined)) {
    return null;
  }
  console.log(data);
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
        <OrderedWordCloud width={600} color="#000" data={data.words} />
        <div className="clearfix">
          <div className="float-end">
            <Button
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
            </Button>
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
            Top Words
            <Chip color="warning" label="experimental" />
          </h2>
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            This is an <i>experimental</i>
            sample-based list of the top words in content matching your query.
            We have not strongly validated the results as representative. Use at your own risk.
          </p>
          { (platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
          <p>
            These results are from a random sample of news stories.
          </p>
          )}
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
