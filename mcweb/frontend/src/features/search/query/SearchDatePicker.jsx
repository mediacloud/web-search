import * as React from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { setStartDate, setEndDate } from './querySlice';
import { latestAllowedEndDate } from '../util/platforms';

export default function SearchDatePicker() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { platform, startDate, endDate } = useSelector((state) => state.query);

  const handleChangeFromDate = (newValue) => {
    dispatch(setStartDate(dayjs(newValue).format('MM/DD/YYYY')));
  };

  const handleChangeToDate = (newValue) => {
    dispatch(setEndDate(dayjs(newValue).format('MM/DD/YYYY')));
  };

  if (dayjs(endDate) > latestAllowedEndDate(platform)) {
    handleChangeToDate(latestAllowedEndDate(platform));
    enqueueSnackbar('Changed your end date to match this platform limit', { variant: 'warning' });
  }

  return (
    <>
      <div className="date-picker-wrapper">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            required
            type="date"
            label="From"
            value={startDate}
            onChange={handleChangeFromDate}
            disableFuture
            disableHighlightToday
            maxDate={endDate}
            renderInput={(params) => <TextField {...params} />}
          />
          <DatePicker
            required
            label="To"
            value={endDate}
            onChange={handleChangeToDate}
            disableFuture
            disableHighlightToday
            maxDate={dayjs(latestAllowedEndDate(platform).format('MM/DD/YYYY'))}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
      </div>
      <p className="help">
        Each platform has different limitations on how recent your search can be.
        The start and end dates are inclusive.
      </p>
    </>
  );
}
