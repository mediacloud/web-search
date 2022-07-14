import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Button } from '@mui/material';

export default function MaterialUIPickers() {

  const [fromValue, setFromValue] = React.useState();
  const [toValue, setToValue] = React.useState();


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

          Search Feature

          {/* terms */}
          <TextField
            required
            id="standard-multiline-static"
            label="Terms"
            name="terms"
            multiline
            rows={4}

          />

          {/* From Date */}
          <DesktopDatePicker
            required
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
        </Stack>
      </LocalizationProvider>
    </div >
  );
}