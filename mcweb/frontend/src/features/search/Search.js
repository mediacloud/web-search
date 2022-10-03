import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';

// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { openModal } from '../ui/uiSlice';
import { useSelector } from 'react-redux';

import { useGetSearchMutation } from '../../app/services/searchApi';

export default function Search() {

  const { enqueueSnackbar } = useSnackbar();

  const [search, { isSearching }] = useGetSearchMutation();

  const totalAttention = useSelector(selectTotalAttention);

  const dispatch = useDispatch();

  // MUI does not handle "name" with a DatePicker (massive bug)
  const [formState, setFormState] = React.useState({
    query_str: '',
  }); 

  const [fromValue, setFromValue] = React.useState(() => {
    if (fromValue === undefined) {
      return createDate();
    }
  });

  const [toValue, setToValue] = React.useState(() => {
    if (toValue === undefined) {
      return createDate();
    }
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }));

  const handleChangeFromDate = (newValue) => {
    if (fromValue === undefined) {
      setFromValue(newValue);
    } else {
      setFromValue(dateConverter(newValue.toString()));
    }
  };

  const handleChangeToDate = (newValue) => {
    if (toValue === undefined) {
      setToValue(newValue);
    } else {
      setToValue(dateConverter(newValue.toString()));
    }
  };

  // converts the MUI date picker date to a usable date for server 
  function dateConverter(date) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    let firstSpace = date.indexOf(' ') + 1;
    let secondSpace = date.substring(firstSpace + 1).indexOf(' ') + firstSpace + 1;
    let thirdSpace = date.substring(secondSpace + 1).indexOf(' ') + secondSpace + 1;
    let fourthSpace = date.substring(thirdSpace + 1).indexOf(' ') + thirdSpace + 1;

    let month = date.substring(firstSpace, secondSpace);
    secondSpace++;

    let day = date.substring(secondSpace, thirdSpace);
    thirdSpace++;

    let year = date.substring(thirdSpace, fourthSpace);

    month = months.indexOf(month.toLowerCase()) + 1;

    return year + "-" + month + "-" + day;

  }

  // YYYY - MM - DD
  function createDate() {
    const today = new Date();
    return today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  }

  return (
    <>

      <div className="searchTitle">
        <h1>Featured Collections</h1>
      </div>


      <div className="searchContainer">
        <LocalizationProvider dateAdapter={AdapterDateFns}>

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
              onChange={handleChange}

            />

            {/* From Date */}
            <DesktopDatePicker
              required
              type='date'
              label="From"
              inputFormat="MM/dd/yyyy"
              value={fromValue}
              onChange={handleChangeFromDate}
              renderInput={(params) => <TextField {...params} />}
            />

            {/* To Date */}
            <DesktopDatePicker
              required
              label="To"
              inputFormat="MM/dd/yyyy"
              value={toValue}
              onChange={handleChangeToDate}
              renderInput={(params) => <TextField {...params} />}
            />

            {/* Submit */}
            <Button
              fullWidth
              variant="outlined"
              onClick={async () => {
                try {
                  const count = await
                    search({
                      query: formState.query_str,
                      start: fromValue,
                      end: toValue,
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

            <button onClick={() => dispatch(openModal('mediaPicker'))}> Open Modal</button>

            <h1>Total Attention: {totalAttention} </h1>
          </Stack>
        </LocalizationProvider>
      </div>
    </>
  );
}