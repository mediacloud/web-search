import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useState } from 'react';
import { useGetSearchMutation, useMakeQueryMutation } from '../../app/services/searchApi';


// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { openModal } from '../ui/uiSlice';
import { setQueryResults } from './resultsSlice';
import SelectedMedia from './media_picker/SelectedMedia';
import SearchDatePicker from './SearchDatePicker';
import SimpleSearch from './SimpleSearch';
import CountOverTimeResults from './results/CountOverTimeResults';
// import { selectQuery, selectNegatedQuery, selectFromDate, selectToDate } from '../search/searchSlice';

export default function Search() {

  const {totalAttention} = useSelector(state => state.search );
  // const query = useSelector(selectQuery);
  const {enqueueSnackbar} = useSnackbar();
  const dispatch = useDispatch();
  const [platform, setPlatform] = useState('Online News Archive');

  const { startDate, 
          endDate, 
          queryString, 
          queryList, 
          negatedQueryList,
          collections,
          sources } = useSelector(state => state.query);

  const collectionIds = collections.map(collection => collection['id']);

  const handleChangePlatform = (event) => {
    setPlatform(event.target.value);
  };
  // const [search, { isSearching }] = useGetSearchMutation();
  const [query, {isLoading, data}] = useMakeQueryMutation();

  return (
    <>

      {/* Choose any platform  */}
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
      </div>

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
                'query': queryList,
                'negatedList': negatedQueryList,
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
    
      <h1>Total Attention: {totalAttention} </h1>

      {data && (
        <CountOverTimeResults  />
      )}
    </>
  );
}