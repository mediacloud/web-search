import * as React from 'react';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import PlatformPicker from './query/PlatformPicker';
import {useState} from 'react';
// information from store
import { openModal } from '../ui/uiSlice';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import SampleStories from './results/SampleStories';
import { setSearchTime } from './query/querySlice';
import Looks3Icon from '@mui/icons-material/Looks3';
import TotalAttentionChart from './results/TotalAttentionChart';
import dayjs from 'dayjs';
import CountOverTimeChart from './results/CountOverTimeChart';
import MediaPicker from './query/media-picker/MediaPicker';

export default function Search() {

  const {enqueueSnackbar} = useSnackbar();
  const dispatch = useDispatch();

  const { platform } = useSelector(state => state.query);

  const PLATFORM_ONLINE_NEWS = "onlinenews";
  const [isOpen, setIsOpen] = useState(false);

  if (platform === "Choose a Platform"){
    dispatch(openModal("platformPicker"));
  }
  return (
    <div className='container search-container'>
        <div className='row'>
          <div className='col-3'>
            <PlatformPicker />
          </div>
          <div className='col-9'>
            <SimpleSearch />
          </div>
        </div>

        <div className="row">
          
            {platform === PLATFORM_ONLINE_NEWS && (
              <div className='col'>
                <div className='selected-media-title'>
                  <Looks3Icon />
                  <h3>Select Your Media</h3>
                </div>
                <SelectedMedia />
                <MediaPicker />
                <p className='selected-media-info'>Choose individual sources or collections to be searched.
                  Our system includes collections for a large range of countries,
                  in multiple languages. Learn more about choosing media.</p>
              </div>
            )}
          
          <div className="col">
            <SearchDatePicker />
          </div>
        </div>
         
      {/* Submit */}
      <Button
        fullWidth
        variant="outlined"
        onClick={async () => {
          enqueueSnackbar("Query Dispatched Please Wait for Results", { variant: 'success'});
          try {
            dispatch(setSearchTime(dayjs().format()));      
          } catch {
            enqueueSnackbar("Query is empty", { variant: 'error' });
          }
        }}
      >
        Search
      </Button>

      <div className='results-container'>
        <TotalAttentionChart />
        <CountOverTimeChart />
        <SampleStories  />
      </div>

    </ div>
  );
}