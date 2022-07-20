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
import { yearsToMonths } from 'date-fns';


export default function Search() {

  const isLoggedIn = useSelector(selectIsLoggedIn);

  const [fromValue, setFromValue] = React.useState();
  const [toValue, setToValue] = React.useState();

  const handleChangeFromDate = (newValue) => {
    setFromValue(newValue);
  };
  const handleChangeToDate = (newValue) => {
    setToValue(newValue);
  };

  // username and password
  const [formState, setFormState] = React.useState();

  const handleChange = ({ target: { date, value } }) => setFormState((prev) => ({ ...prev, [date]: value }))


  // converts the MUI date picker date to a usable date for server 
  function dateConverter(date) {
    var months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];


    let firstSpace = date.indexOf(' ') + 1
    let secondSpace = date.substring(firstSpace + 1).indexOf(' ') + firstSpace + 1
    let thirdSpace = date.substring(secondSpace + 1).indexOf(' ') + secondSpace + 1
    let fourthSpace = date.substring(thirdSpace + 1).indexOf(' ') + thirdSpace + 1

    let month = date.substring(firstSpace, secondSpace)
    secondSpace++
    
    let day = date.substring(secondSpace, thirdSpace)
    thirdSpace++
    
    let year = date.substring(thirdSpace, fourthSpace)

    month = months.indexOf(month.toLowerCase()) + 1;

   return year + "-" + month + "-" + day

  }

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
                rows={4}
                name="terms"
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
                  const fromValueDate = dateConverter(fromValue.toString())
                  const toValueDate = dateConverter(toValue.toString())

                  console.log(fromValueDate + " " + toValueDate)

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