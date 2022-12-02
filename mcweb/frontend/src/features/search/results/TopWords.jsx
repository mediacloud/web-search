import * as React from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetTopWordsMutation } from '../../../app/services/searchApi';
import queryGenerator from '../util/queryGenerator';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_TWITTER_TWITTER,
} from '../util/platforms';

const supportsDownload = (platform) => [PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_TWITTER_TWITTER].includes(platform);

export default function SampleStories() {
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

  const [query, { isLoading, data }] = useGetTopWordsMutation();

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
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }
  if (!data) return null;

  const content = (
    <div className="results-item-wrapper results-sample-stories">
      <div className="row">
        <div className="col-4">
          <h2>Top Words</h2>
          <p>
            This is a sample of the content that matched your queries.
            Click the menu on the bottom  right to download a CSV of all the
            matching content and associated metadata.
          </p>
          { (platform === PROVIDER_NEWS_MEDIA_CLOUD) && (
            <p>
              These results are from a random sample of news stories.
            </p>
          )}
          { (platform === PROVIDER_REDDIT_PUSHSHIFT) && (
            <p>
              These results are from the titles of the top scoring Reddit submissions.
            </p>
          )}
          { (platform === PROVIDER_TWITTER_TWITTER) && (
            <p>
              These results are from the most recent Tweets.
            </p>
          )}
          { (platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
            <p>
              These results are from a random sample of 5000 news stories.
            </p>
          )}
        </div>
        <div className="col-8">
          Results here...
        </div>
      </div>
    </div>
  );

  let platformSpecficContent;
  if (supportsDownload(platform)) {
    platformSpecficContent = (
      <div className="clearfix">
        <div className="float-end">
          <Button
            variant="text"
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
    );
  }
  return (
    <>
      {content}
      {platformSpecficContent}
    </>
  );
}
