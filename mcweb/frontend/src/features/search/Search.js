import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';

// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { openModal } from '../ui/uiSlice';
import { useGetSearchMutation } from '../../app/services/searchApi';
import { setQueryString } from './querySlice';

import SelectedMedia from './media_picker/SelectedMedia';
import SearchDatePicker from './SearchDatePicker';

export default function Search() {

  const { enqueueSnackbar } = useSnackbar();

  const [search, { isSearching }] = useGetSearchMutation();

  const totalAttention = useSelector(selectTotalAttention);

  const dispatch = useDispatch();

  // MUI does not handle "name" with a DatePicker (massive bug)
  const [formState, setFormState] = React.useState(""); 

  const {startDate, endDate, queryString} = useSelector(state => state.query);

  return (
    <>

      <div className="searchTitle">
        <h1>SEARCH</h1>
      </div>


      <div className="searchContainer">
        {/* <LocalizationProvider dateAdapter={AdapterDateFns}> */}

          <Stack
            spacing={2}
            method="post"
            sx={{backgroundColor: "white", padding: "25px"}}
          >
            {/* Query */}
            <TextField
              fullWidth
              required
              id="standard-multiline-static"
              label="Query"
              name="query_str"
              rows={4}
              onChange={e => dispatch(setQueryString(e.target.value))}

            />

            <SearchDatePicker />

            {/* Submit */}
            <Button
              fullWidth
              variant="outlined"
              onClick={async () => {
                try {
                  const count = await
                    search({
                      query: queryString,
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
            
            <SelectedMedia />
            <button onClick={() => dispatch(openModal('mediaPicker'))}> Select Media</button>

            <h1>Total Attention: {totalAttention} </h1>
          </Stack>
        {/* </LocalizationProvider> */}
      </div>
    </>
  );
}