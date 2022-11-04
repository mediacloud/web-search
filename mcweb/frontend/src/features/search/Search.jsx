import * as React from 'react';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import PlatformPicker from './query/PlatformPicker';
import { openModal } from '../ui/uiSlice';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import SampleStories from './results/SampleStories';
import { setSearchTime, removeSelectedMedia } from './query/querySlice';
import TotalAttentionChart from './results/TotalAttentionChart';
import CountOverTimeResults from './results/CountOverTimeResults';
import MediaPicker from './query/media-picker/MediaPicker';
import urlSerializer from './util/urlSerializer';

export const PLATFORM_ONLINE_NEWS = 'onlinenews';
export const PLATFORM_REDDIT = 'reddit';
export const PLATFORM_YOUTUBE = 'youtube';
export const PLATFORM_TWITTER = 'twitter';

export default function Search() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    collections,
    platform,
    anyAll,
  } = useSelector((state) => state.query);

  // const { platform, previewCollections } = useSelector(state => state.query);

  // const PLATFORM_ONLINE_NEWS = 'onlinenews';

  const queryObject = {
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    platform,
    collections,
    anyAll,
  };

  if (platform === 'Choose a Platform') {
    dispatch(openModal('platformPicker'));
  }
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
        <SimpleSearch />
      </div>

      <div className="container">
        <div className="row">

          <div className="col-5">
            <div className="query-section">
              <h3>
                <em>2</em>
                Pick your collections
              </h3>
              {platform === PLATFORM_ONLINE_NEWS && (
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
              {platform !== PLATFORM_ONLINE_NEWS && (
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
          <TotalAttentionChart />
          <SampleStories />
        </div>
      </div>

    </div>
  );
}
