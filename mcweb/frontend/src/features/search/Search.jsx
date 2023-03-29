import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ContentCopy from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import SaveSearch from './query/savedsearch/SaveSearch';
import { searchApi } from '../../app/services/searchApi';
import PlatformPicker from './query/PlatformPicker';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import SampleStories from './results/SampleStories';
import { setQueryProperty, removeSelectedMedia } from './query/querySlice';
import TotalAttentionResults from './results/TotalAttentionResults';
import CountOverTimeResults from './results/CountOverTimeResults';
import TopLanguages from './results/TopLanguages';
import AdvancedSearch from './query/AdvancedSearch';
import MediaPicker from './query/media-picker/MediaPicker';
import urlSerializer from './util/urlSerializer';
import deactivateButton from './util/deactivateButton';
import TopWords from './results/TopWords';
import AlertDialog from '../ui/AlertDialog';
import { PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_REDDIT_PUSHSHIFT } from './util/platforms';

export default function Search() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  const [open, setOpen] = React.useState(false);

  const queryState = useSelector((state) => state.query);

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

      <div className="container">
        <div className="row">
          <div className="col">
            <PlatformPicker />
          </div>
        </div>
      </div>

      <div className="container">
        {advanced && (
        <AdvancedSearch />
        )}
        {!advanced && (
        <SimpleSearch />
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
              <SelectedMedia onRemove={removeSelectedMedia} collections={collections} sources={sources} />
              <MediaPicker />
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
              <SearchDatePicker />
            </div>
          </div>

        </div>
      </div>

      <div className="search-button-wrapper">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-4">
              <AlertDialog
                openDialog={open}
                outsideTitle="Share this Search"
                title="Share this Search"
                content={<code>{`search.mediacloud.org/search${urlSerializer(queryState)}`}</code>}
                action={handleShare}
                actionTarget
                snackbar
                snackbarText="Search copied to clipboard!"
                dispatchNeeded={false}
                onClick={() => setOpen(true)}
                variant="outlined"
                endIcon={<ContentCopy titleAccess="copy this search" />}
                secondAction={false}
                className="float-start"
                confirmButtonText="copy"
              />
            </div>
            <div className="col-7 ml-auto">
              <div className="d-flex justify-content-end">
                <SaveSearch className="float-end" />
                <Button
                  className="float-end ms-2"
                  variant="contained"
                  disabled={!show}
                  endIcon={<SearchIcon titleAccess="search this query" />}
                  onClick={() => {
                    navigate(`/search${urlSerializer(queryState)}`, { options: { replace: true } });
                    dispatch(searchApi.util.resetApiState());
                    dispatch(setQueryProperty({ lastSearchTime: dayjs().unix() }));
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="search-results-wrapper">
        <div className="container">
          <CountOverTimeResults />
          <TotalAttentionResults />
          <SampleStories />
          <TopWords />
          <TopLanguages />
        </div>
      </div>

    </div>
  );
}
