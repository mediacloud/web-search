import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';


// information from store
import { selectIsLoggedIn } from '../../features/auth/authSlice';
import { useSelector } from 'react-redux';


export default function Search() {
  
  const isLoggedIn = useSelector(selectIsLoggedIn);


  const [fromValue, setFromValue] = React.useState();
  const [toValue, setToValue] = React.useState();


  // integrate soon 
  const { enqueueSnackbar } = useSnackbar();

  const handleChangeFromDate = (newValue) => {
    setFromValue(newValue);
  };

  const handleChangeToDate = (newValue) => {
    setToValue(newValue);
  };


  return (
    <div style={{ paddingTop: "200px" }}>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Stack spacing={2} >

          {isLoggedIn &&
            <>
              {/* terms */}
              <TextField
                required
                id="standard-multiline-static"
                label="Terms"
                multiline
                rows={4}
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
                  console.log(fromValue + " " + " " + toValue)
                }}
              >
                Submit
              </Button>
            </>

          }

          {!isLoggedIn && <h2>Must be logged in for this feature</h2>}

        </Stack>
      </LocalizationProvider>
    </div >
  );
}