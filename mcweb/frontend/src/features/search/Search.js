import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useState } from 'react';
import { useGetSearchMutation } from '../../app/services/searchApi';


// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { openModal } from '../ui/uiSlice';
import { setQueryString } from './querySlice';
import SelectedMedia from './media_picker/SelectedMedia';
import SearchDatePicker from './SearchDatePicker';
import SimpleSearch from './SimpleSearch';
import { selectQuery, selectNegatedQuery, selectFromDate, selectToDate } from '../search/searchSlice';

export default function Search() {

  const totalAttention = useSelector(selectTotalAttention);
  const query = useSelector(selectQuery);
  const negatedQuery = useSelector(selectNegatedQuery);
  const fromDate = useSelector(selectFromDate);
  const toDate = useSelector(selectToDate);
  const {enqueueSnackbar} = useSnackbar();
  const dispatch = useDispatch();
  const [platform, setPlatform] = useState('Online News Archive');
  const { startDate, endDate, queryString } = useSelector(state => state.query);

  const handleChangePlatform = (event) => {
    setPlatform(event.target.value);
  };
  const [search, { isSearching }] = useGetSearchMutation();

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
            const count = await
              search({
                query: query,
                start: startDate,
                end: endDate,
              }).unwrap();
            dispatch(setSearch(count));
            enqueueSnackbar("Total Attention Discovered", { variant: 'success' });
          } catch {
            enqueueSnackbar("Query is empty", { variant: 'error' });
          }
        }}
      >
        Submit
      </Button>
    
      <div>
          <h1>Query: {query}</h1>
          <h1>Negated Query: {negatedQuery}</h1>
          <h1>From Date: {fromDate}</h1>
          <h1>To Date: {toDate}</h1>

      </div>
      <h1>Total Attention: {totalAttention} </h1>
    </>
  );
}