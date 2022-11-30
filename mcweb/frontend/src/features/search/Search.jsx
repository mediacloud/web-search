import React from 'react';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
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
import { PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE } from './util/platforms';

export default function Search() {
  const { enqueueSnackbar } = useSnackbar();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {
    queryString,
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    collections,
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
    anyAll,
    advanced,
  };

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
                Pick your collections
              </h3>
              {[PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE].includes(platform) && (
                <>
                  <SelectedMedia onRemove={removeSelectedMedia} />
                  <MediaPicker />
                  <p className="help">
                    Choose individual sources or collections to be searched.
                    Our system includes collections for a large range of countries,
                    in multiple languages.
                  </p>
                </>
              )}
              {![PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE].includes(platform) && (
                <p>Currently unsupported</p>
              )}
            </div>
          </div>

          <div className="col-6 offset-1">
            <div className="query-section">
              <h3>
                <em>3</em>
                Pick your dates
              </h3>
              <SearchDatePicker />
            </div>
          </div>

        </div>
      </div>

      <div className="search-button-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              {/* Submit */}
              <Button
                className="float-end"
                variant="contained"
                onClick={() => {
                  try {
                    navigate(
                      `/search${urlSerializer(queryObject)}`,
                      { options: { replace: true } },
                    );
                    dispatch(searchApi.util.resetApiState());
                    dispatch(setSearchTime(dayjs().format()));
                  } catch {
                    enqueueSnackbar('Query is empty', { variant: 'error' });
                  }
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
