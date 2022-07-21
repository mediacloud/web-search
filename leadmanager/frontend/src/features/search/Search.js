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


  // query_str (string of queries)
  // start_date 
  // end_date
  const [formState, setFormState] = React.useState({
    query_str: '',
    start_date: '',
    end_date: ''
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))



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
              {/* Query */}
              <TextField
                required
                id="standard-multiline-static"
                label="Query"
                rows={4}
                name="query"
                onChange={handleChange}
              // renderInput={(params) => <TextField {...params} />}

              />

              {/* From Date */}
              <DesktopDatePicker
                required
                type='date'
                label="From"
                inputFormat="MM/dd/yyyy"
                onChange={handleChange}
                renderInput={(params) => <TextField {...params} />}
              />

              {/* To Date */}
              <DesktopDatePicker
                required
                label="To"
                inputFormat="MM/dd/yyyy"
                onChange={handleChange}
                renderInput={(params) => <TextField {...params} />}
              />

              {/* Submit */}
              <Button
                fullWidth
                variant="outlined"
                onClick={async () => {
                  // const fromValueDate = dateConverter(fromValue.toString())
                  // const toValueDate = dateConverter(toValue.toString())

                  // console.log(fromValueDate + " " + toValueDate)

                  console.log(formState.query_str)
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