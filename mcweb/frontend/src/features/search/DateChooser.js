import * as React from 'react';
import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useDispatch } from 'react-redux';

import { setToDate, setFromDate } from './searchSlice';
// information from store

export default function DateChooser(props) {

  const dispatch = useDispatch()

  const [date, setDate] = useState(() => {
    if (fromValue === undefined) {
      return createDate();
    }
  });

  const [fromValue, setFromValue] = React.useState(() => {
    if (fromValue === undefined) {
      return createDate();
    }
  });

  console.log(date)


  const handleChange = (value) => {
    if (date === undefined) {
      setDate(value);
    } else {
      setDate(dateConverter(value.toString()))
    }

    if(props.props === "From") {
      dispatch(setFromDate(date));
    } else {
      dispatch(setToDate(date));
    }
  };


  // converts the MUI date picker date to a usable date for server 
  function dateConverter(date) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

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
    <LocalizationProvider dateAdapter={AdapterDateFns}>

      {/* From Date */}
      <DesktopDatePicker
        required
        type='date'
        inputFormat="MM/dd/yyyy"
        value={date}
        onChange={handleChange}
        renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
    )


}