import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import Alert from '@mui/material/Alert';
// import PlatformPicker from './query/PlatformPicker';
import SelectedMedia from './SelectedMedia';
import SearchDatePicker from './SearchDatePicker';
import SimpleSearch from './SimpleSearch';
import {
  removeSelectedMedia, copyToAllQueries, QUERY, MEDIA, DATES,
} from './querySlice';
import CopyToAll from '../util/CopyToAll';
import AdvancedSearch from './AdvancedSearch';
import MediaPicker from './media-picker/MediaPicker';
import { PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_REDDIT_PUSHSHIFT } from '../util/platforms';

export default function Search({ queryIndex }) {
  const queryState = useSelector((state) => state.query[queryIndex]);
  const dispatch = useDispatch();
  const {
    collections,
    sources,
    advanced,
    platform,
  } = queryState;

  const [openQuery, setOpenQuery] = useState(false);
  const [openMedia, setOpenMedia] = useState(false);
  const [openDates, setOpenDates] = useState(false);

  const handleCopyAll = (queryProperty) => {
    dispatch(copyToAllQueries({ property: queryProperty, queryIndex }));
  };

  return (
    <div className="search-container">

      {advanced && (
        <AdvancedSearch queryIndex={queryIndex} />
      )}
      {!advanced && (
        <SimpleSearch queryIndex={queryIndex} />
      )}

      <div className="container">
        <div className="row">
          <div className="col-5">
            <div className="query-section">
              <h3>
                <em>2</em>
                Pick collections and sources
              </h3>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              <CopyToAll
                openDialog={openMedia}
                title="Copy To All Queries"
                content="Are you sure you want to copy these sources and collections
                to all your queries? This will replace the Media Selections for all of your queries."
                action={copyToAllQueries}
                actionTarget={{ property: MEDIA, queryIndex }}
                snackbar
                snackbarText="Media Copied To All Queries"
                dispatchNeeded
                onClick={() => setOpenMedia(true)}
                className="float-end"
                confirmButtonText="OK"
              />
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
                <CopyToAll
                  openDialog={openDates}
                  title="Copy To All Queries"
                  content="Are you sure you want to copy these dates to all your queries?
                  This will replace the dates for all of your queries"
                  action={copyToAllQueries}
                  actionTarget={{ property: DATES, queryIndex }}
                  snackbar
                  snackbarText="Dates Copied To All Queries"
                  dispatchNeeded
                  onClick={() => setOpenDates(true)}
                  className="float-end"
                  confirmButtonText="OK"
                />
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
