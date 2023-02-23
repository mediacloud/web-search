/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { setQueryProperty } from './querySlice';
import { earliestAllowedStartDate, latestAllowedEndDate } from '../util/platforms';
import DefaultDates from './DefaultDates';

export default function SearchDatePicker({ queryIndex }) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { platform, startDate, endDate } = useSelector((state) => state.query[queryIndex]);

  const handleChangeFromDate = (newValue) => {
    dispatch(setQueryProperty({ startDate: dayjs(newValue).format('MM/DD/YYYY') }));
  };

  const handleChangeToDate = (newValue) => {
    dispatch(setQueryProperty({ endDate: dayjs(newValue).format('MM/DD/YYYY') }));
  };

  useEffect(() => {
    // dispatch(setQueryProperty({ endDate: latestAllowedEndDate(platform).format('MM/DD/YYYY') }));
    if (dayjs(endDate) > latestAllowedEndDate(platform)) {
      handleChangeToDate(latestAllowedEndDate(platform));
      enqueueSnackbar('Changed your end date to match this platform limit', { variant: 'warning' });
    }
    if (dayjs(startDate) < earliestAllowedStartDate(platform)) {
      handleChangeFromDate(earliestAllowedStartDate(platform));
      enqueueSnackbar('Changed your start date to match this platform limit', { variant: 'warning' });
    }
  }, [platform]);

  return (
    <>
      <div className="date-picker-wrapper local-provider">
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
            minDate={dayjs(earliestAllowedStartDate(platform).format('MM/DD/YYYY'))}
            renderInput={(params) => <TextField {...params} />}
          />
          <DatePicker
            required
            label="To"
            value={endDate}
            onChange={handleChangeToDate}
            disableFuture
            disableHighlightToday
            minDate={dayjs(earliestAllowedStartDate(platform).format('MM/DD/YYYY')).add('1', 'day')}
            maxDate={dayjs(latestAllowedEndDate(platform).format('MM/DD/YYYY'))}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
      </div>
      <p className="help">
        Each platform has different limitations on how recent your search can be.
        The start and end dates are inclusive.
      </p>

      <DefaultDates platform={platform} amountOfTime="1" typeOfTime="month" message="Last Month" />

      <DefaultDates platform={platform} amountOfTime="3" typeOfTime="month" message="Last 3 Months" />

    </>
  );
}

SearchDatePicker.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
