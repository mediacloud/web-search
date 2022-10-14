import * as React from 'react';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useMakeQueryMutation } from '../../app/services/searchApi';
import PlatformPicker from './media_picker/PlatformPicker';

// information from store
import { openModal } from '../ui/uiSlice';
import { setQueryResults } from './resultsSlice';
import SelectedMedia from './media_picker/SelectedMedia';
import SearchDatePicker from './SearchDatePicker';
import SimpleSearch from './SimpleSearch';
import CountOverTimeResults from './results/CountOverTimeResults';
import SampleStories from './results/SampleStories';
import { setQueryString } from './querySlice';


export default function Search() {

  const {count} = useSelector(state => state.results );
  // const query = useSelector(selectQuery);
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

  // const handleChangePlatform = (event) => {
  //   setPlatform(event.target.value);
  // };
  // const [search, { isSearching }] = useGetSearchMutation();
  const [query, {isLoading, data}] = useMakeQueryMutation();

  const formatQuery = (queryList, negatedQueryList) => {
    let fullQuery = "";
    if (negatedQueryList === ""){
      fullQuery = `(${queryList})`;
    }else {
      fullQuery = `(${queryList}) AND NOT (${negatedQueryList})`;
    }
    dispatch(setQueryString(fullQuery));
    return fullQuery;
  };

  if (platform === "Choose a Platform"){
    dispatch(openModal("platformPicker"));
  }
  return (
    <>
      <PlatformPicker />
      {/* Choose any platform 
      <div className='services'>
        <h1>Choose your Media</h1>
        <Select
          value={platform}
          onChange={handleChangePlatform}
        >
          <MenuItem value={"Online News Archive"}>Online News Archive</MenuItem>
          <MenuItem value={"Reddit"}>Reddit</MenuItem>
          <MenuItem value={"Twitter"}>Twitter</MenuItem>
          <MenuItem value={"Youtube"}>Youtube</MenuItem>
        </Select>
      </div> */}

      {/* Choose Query Type */}
      <SimpleSearch />

      <SelectedMedia />
      <button onClick={() => dispatch(openModal('mediaPicker'))}> Select Media</button>

      <SearchDatePicker />
      
      {/* Submit */}
      <Button
        fullWidth
        variant="outlined"
        onClick={async () => {
          try {
            const queryResult = await
              query({
                'query': formatQuery(queryList, negatedQueryList),
                startDate,
                endDate,
                'collections': collectionIds,
                sources,
                platform
              }).unwrap();
            dispatch(setQueryResults(queryResult));
            
            enqueueSnackbar("Total Attention Discovered", { variant: 'success' });
          } catch {
            enqueueSnackbar("Query is empty", { variant: 'error' });
          }
        }}
      >
        Submit
      </Button>
    
      <h1>Total Attention: {count} </h1>
      {data && (
        <div className='results-container'>
          <CountOverTimeResults />
          <SampleStories platform={platform} />
        </div>

      )}
    </>
  );
}