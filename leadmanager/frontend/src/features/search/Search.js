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




  // MUI does not handle "name" with a DatePicker (massive bug)
  const [formState, setFormState] = React.useState({
    query_str: '',
  });

  const [fromValue, setFromValue] = React.useState(() => {
    if (fromValue === undefined) {
      return createDate()
    }
  });

  const [toValue, setToValue] = React.useState(() => {
    if (toValue === undefined) {
      return createDate()
    }
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  const handleChangeFromDate = (newValue) => {
    if (fromValue === undefined) {
      setFromValue(newValue);
    } else {
      setFromValue(dateConverter(newValue.toString()))
    }
  };

  const handleChangeToDate = (newValue) => {
    if (toValue === undefined) {
      setToValue(newValue);
    } else {
      setToValue(dateConverter(newValue.toString()))
    }
  };

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

  // YYYY - MM - DD
  function createDate() {
    var today = new Date()
    return today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate()
  }

  return (
    <div style={{ paddingTop: "200px" }}>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Stack spacing={2} >

          {isLoggedIn &&
            <>


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
                  console.log("Query : " + formState.query_str)
                  console.log("From: " + fromValue)
                  console.log("To: " + toValue)
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