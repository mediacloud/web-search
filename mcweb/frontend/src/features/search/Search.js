import * as React from 'react';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import PlatformPicker from './query/PlatformPicker';
import {useState, useEffect} from 'react';
// information from store
import { openModal } from '../ui/uiSlice';
import QueryPreview from './query/QueryPreview';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import SampleStories from './results/SampleStories';
import { setSearchTime, removeSelectedMedia } from './query/querySlice';
import Looks3Icon from '@mui/icons-material/Looks3';
import TotalAttentionChart from './results/TotalAttentionChart';
import dayjs from 'dayjs';
import CountOverTimeChart from './results/CountOverTimeChart';
import MediaPicker from './query/media-picker/MediaPicker';
import {useNavigate} from 'react-router-dom';
import { queryGenerator } from './util/queryGenerator';
import urlSerializer from './util/urlSerializer';
import { useSearchParams } from 'react-router-dom';
import setSearchQuery from '../search/util/setSearchQuery';

export default function Search() {
  // let [searchParams, setSearchParams] = useSearchParams();
  // useEffect(()=> {
  //   setSearchQuery(searchParams); // set query paramaters from url
  // }, []);

  const {enqueueSnackbar} = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { queryList,
          negatedQueryList,
          startDate,
          endDate,
          collections, 
          platform, 
          anyAll
        } = useSelector(state => state.query);

  // const { platform, previewCollections } = useSelector(state => state.query);

  const PLATFORM_ONLINE_NEWS = "onlinenews";
  const PLATFORM_REDDIT = "reddit";
  const PLATFORM_YOUTUBE = "youtube";

  const [isOpen, setIsOpen] = useState(false);
  
  const queryString = queryGenerator(queryList, negatedQueryList, platform, anyAll);

  

  const queryObject = {
    queryList: queryList,
    negatedQueryList: negatedQueryList,
    startDate: startDate,
    endDate: endDate,
    platform: platform,
    collections: collections,
    anyAll: anyAll
  };

  if (platform === "Choose a Platform"){
    dispatch(openModal("platformPicker"));
  }
  return (
    <div className='search-container'>

      <div className="container">
        <div className='row'>
          <div className='col' >
            <PlatformPicker />
          </div>
        </div>
      </div>

      <div className="container">
        <SimpleSearch />
      </div>

      <div className="container">
        <div className="row">

          <div className="col-6">
            <div className='query-section'>
              <h3><em>2</em>Pick your collections</h3>
              {platform === PLATFORM_ONLINE_NEWS && (
                <>
                  <SelectedMedia onRemove={removeSelectedMedia}/>
                  <MediaPicker />
                  <p className='help'>Choose individual sources or collections to be searched.
                    Our system includes collections for a large range of countries,
                    in multiple languages.</p>
                </>
              )}
              {platform !== PLATFORM_ONLINE_NEWS && (
                <p>Currently unsupported</p>
              )}
            </div>
          </div>

          <div className="col-6">
            <div className='query-section'>
              <h3><em>3</em>Pick your dates</h3>
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
                className="float-right"
                variant="contained"
                onClick={async () => {
                  try {
                    // navigate(
                    //   `/search${urlSerializer(queryObject)}`,
                    //   { options: { replace: true } }
                    // );
                    dispatch(setSearchTime(dayjs().format()));
                  } catch {
                    enqueueSnackbar("Query is empty", { variant: 'error' });
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
        <div className='container'>
          <CountOverTimeChart />
          <TotalAttentionChart />
          <SampleStories  />
        </div>
      </div>

    </ div>
  );
}
