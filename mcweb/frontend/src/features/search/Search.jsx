import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
// import PlatformPicker from './query/PlatformPicker';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import { removeSelectedMedia } from './query/querySlice';
import AdvancedSearch from './query/AdvancedSearch';
import MediaPicker from './query/media-picker/MediaPicker';
import urlSerializer from './util/urlSerializer';
import deactivateButton from './util/deactivateButton';
import { PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_REDDIT_PUSHSHIFT } from './util/platforms';

export default function Search({ queryIndex }) {
  const [show, setShow] = useState(true);

  const queryState = useSelector((state) => state.query[queryIndex]);

  const {
    collections,
    sources,
    advanced,
    platform,
  } = queryState;

  const handleShare = () => {
    const ahref = `search.mediacloud.org/search${urlSerializer(queryState)}`;
    navigator.clipboard.writeText(ahref);
  };

  useEffect(() => {
    setShow(deactivateButton(queryState));
  }, [queryState]);

  return (
    <div className="search-container">
      {/* <div className="container">
        <div className="row">
          <div className="col">

            <PlatformPicker queryIndex={queryIndex} />
          </div>
        </div>
      </div> */}

      <div className="container">
        {advanced && (
        <AdvancedSearch queryIndex={queryIndex} />
        )}
        {!advanced && (
        <SimpleSearch queryIndex={queryIndex} />
        )}
      </div>

      <div className="container">
        <div className="row">

          <div className="col-5">
            <div className="query-section">
              <h3>
                <em>2</em>
                Pick collections and sources
              </h3>

              <SelectedMedia onRemove={removeSelectedMedia} collections={collections} sources={sources} queryIndex={queryIndex} />
              <MediaPicker queryIndex={queryIndex} />
              <p className="help">
                Choose individual sources or collections to be searched.
                Our system includes collections for a large range of countries,
                in multiple languages.
              </p>
            </div>
          </div>

          <div className="col-6 offset-1">
            <div className="query-section">
              <h3>
                <em>3</em>
                Pick dates
              </h3>
              {platform === PROVIDER_NEWS_WAYBACK_MACHINE && (
                <Alert severity="warning">
                  Your dates have been limited to the range of available data.
                  We are still working with the Wayback Machine to ingest the historical data.
                </Alert>
              )}
              {platform === PROVIDER_REDDIT_PUSHSHIFT && (
                <Alert severity="warning">
                  PushShift.io moved to a new server; data before 11/1/22 unavailable.
                </Alert>
              )}
              <SearchDatePicker queryIndex={queryIndex} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Search.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
