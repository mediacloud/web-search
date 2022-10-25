import * as React from 'react';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useMakeQueryMutation } from '../../app/services/searchApi';
import PlatformPicker from './query/PlatformPicker';

// information from store
import { openModal } from '../ui/uiSlice';
import { setQueryResults } from './resultsSlice';
import SelectedMedia from './query/SelectedMedia';
import SearchDatePicker from './query/SearchDatePicker';
import SimpleSearch from './query/SimpleSearch';
import SampleStories from './results/SampleStories';
import { setQueryString, setSearchTime } from './query/querySlice';
import Looks3Icon from '@mui/icons-material/Looks3';
import TotalAttentionChart from './results/TotalAttentionChart';
import dayjs from 'dayjs';
import CountOverTimeChart from './results/CountOverTimeChart';

export default function Search() {

  const {enqueueSnackbar} = useSnackbar();
  const dispatch = useDispatch();

  const { startDate, 
          endDate, 
          queryString, 
          queryList, 
          negatedQueryList,
          collections,
          sources,
          platform } = useSelector(state => state.query);

  const collectionIds = collections.map(collection => collection['id']);
  const PLATFORM_ONLINE_NEWS = "onlinenews";
  const [query, {isLoading, data}] = useMakeQueryMutation();

  // const formatQuery = (queryList, negatedQueryList) => {
  //   let fullQuery = "";
  //   if (negatedQueryList === ""){
  //     fullQuery = `(${queryList})`;
  //   }else {
  //     if (platform === "Online News Archive"){
  //       fullQuery = `(${queryList}) AND NOT (${negatedQueryList})`;
  //     }else {
  //       fullQuery = `(${queryList}) -${negatedQueryList}`;
  //     }
      
  //   }
  //   dispatch(setQueryString(fullQuery));
  //   return fullQuery;
  // };

  if (platform === "Choose a Platform"){
    dispatch(openModal("platformPicker"));
  }
  return (
    <div className='search-container'>
      <div className='query-inputs'>
        <PlatformPicker />

        {/* Choose Query Type */}
        <SimpleSearch />
        {platform === PLATFORM_ONLINE_NEWS && (
          <div className='search-selected-media-container'>
            <div className='selected-media-title'>
              <Looks3Icon />
              <h3>Select Your Media</h3>
            </div>
            <SelectedMedia />
            <p className='selected-media-info'>Choose individual sources or collections to be searched.
              Our system includes collections for a large range of countries,
              in multiple languages. Learn more about choosing media.</p>
            <button onClick={() => dispatch(openModal('mediaPicker'))}> Select Media</button>
          </div>
        )}
        <SearchDatePicker />
      </div>

      
      {/* Submit */}
      <Button
        fullWidth
        variant="outlined"
        onClick={async () => {
          enqueueSnackbar("Query Dispatched Please Wait for Results", { variant: 'success'});
          try {
            dispatch(setSearchTime(dayjs().format()));
            // const queryResult = await
            //   query({
            //     'query': formatQuery(queryList, negatedQueryList),
            //     startDate,
            //     endDate,
            //     'collections': collectionIds,
            //     sources,
            //     platform
            //   }).unwrap();
            // dispatch(setQueryResults(queryResult));
            
            enqueueSnackbar("Total Attention Discovered", { variant: 'success' });
          } catch {
            enqueueSnackbar("Query is empty", { variant: 'error' });
          }
        }}
      >
        Submit
      </Button>

      
    
      
        <div className='results-container'>
          <TotalAttentionChart />
          <CountOverTimeChart />
          <SampleStories  />
        </div>

    </ div>
  );
}