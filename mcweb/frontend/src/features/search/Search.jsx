import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import { ContentCopy, IosShare } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../app/services/searchApi';
import PlatformPicker from './query/PlatformPicker';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import SampleStories from './results/SampleStories';
import { setSearchTime, removeSelectedMedia } from './query/querySlice';
import TotalAttentionResults from './results/TotalAttentionResults';
import CountOverTimeResults from './results/CountOverTimeResults';
import AdvancedSearch from './query/AdvancedSearch';
import MediaPicker from './query/media-picker/MediaPicker';
import urlSerializer from './util/urlSerializer';
import deactivateButton from './util/deactivateButton'; 
import SearchIcon from '@mui/icons-material/Search';


export default function Search() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const {
    queryString,
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    collections,
    sources,
    platform,
    anyAll,
    advanced,
  } = useSelector((state) => state.query);

  const queryObject = {
    queryList,
    negatedQueryList,
    queryString,
    startDate,
    endDate,
    platform,
    collections,
    sources,
    anyAll,
    advanced,
  };

  const handleShare = (e) => {
    e.preventDefault();
    const ahref = `search.mediacloud.org/search${urlSerializer(queryObject)}`;
    switch (e.currentTarget.id) {
      case 'copy':
        navigator.clipboard.writeText(ahref);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    setShow(deactivateButton(queryObject));
  }, [queryObject]);

  return (
    <div className="search-container">

      <div className="container">
        <div className="row">
          <div className="col">
            <PlatformPicker />
          </div>
        </div>
      </div>

      {!advanced && (
        <div className="container">
          <SimpleSearch />
        </div>
      )}

      {advanced && (
        <div className="container">
          <AdvancedSearch />
        </div>
      )}

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
              <SearchDatePicker />
            </div>
          </div>

        </div>
      </div>

      <div className="search-button-wrapper">
        <div className="container">
          <div className="row">

            <div className="col-11">
              <Button
                onClick={handleClickOpen}
                className="float-end"
                variant="contained"
                endIcon={<IosShare titleAccess="share this search"/>}
              >
                Share this Search
              </Button>
              <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogTitle id="alert-dialog-title">
                  Share this Search
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    <code>
                      {' '}
                      {`search.mediacloud.org/search${urlSerializer(queryObject)}`}
                      {' '}
                    </code>
                  </DialogContentText>
                </DialogContent>
                <DialogActions>

                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy titleAccess="copy this search"/>}
                    id="copy"
                    onClick={handleShare}
                  >
                    {' '}
                    copy

                  </Button>
                  <Button variant="contained" onClick={handleClose}> Close </Button>
                </DialogActions>
              </Dialog>

            </div>

            <div className="col-1">
              {/* Submit */}
              <Button
                className="float-end"
                variant="contained"
                disabled={!show}
                endIcon={<SearchIcon titleAccess="search this query"/>}
                onClick={() => {
                  navigate(
                    `/search${urlSerializer(queryObject)}`,
                    { options: { replace: true } },
                  );
                  dispatch(searchApi.util.resetApiState());
                  dispatch(setSearchTime(dayjs().unix()));
                }}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="search-results-wrapper">
        <div className="container">
          <CountOverTimeResults />
          <TotalAttentionResults />
          <SampleStories />
        </div>
      </div>

    </div>
  );
}
