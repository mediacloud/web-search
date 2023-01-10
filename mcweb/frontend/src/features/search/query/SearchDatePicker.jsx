/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { setStartDate, setEndDate } from './querySlice';
import { latestAllowedEndDate } from '../util/platforms';
import DefaultDates from './DefaultDates';

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

  useEffect(() => {
    dispatch(setEndDate(latestAllowedEndDate(platform).format('MM/DD/YYYY')));
    if (dayjs(endDate) > latestAllowedEndDate(platform)) {
      handleChangeToDate(latestAllowedEndDate(platform));
      enqueueSnackbar('Changed your end date to match this platform limit', { variant: 'warning' });
    }
  }, [platform]);

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

      <DefaultDates amountOfTime="1" typeOfTime="month" message="Last Month" />

      <DefaultDates amountOfTime="3" typeOfTime="month" message="Last 3 Months" />

      <DefaultDates amountOfTime="1" typeOfTime="year" message="Last Year" />

    </>
  );
}
