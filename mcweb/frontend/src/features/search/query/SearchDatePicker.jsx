/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
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
import validateDate from '../util/dateValidation';
import DefaultDates from './DefaultDates';

export default function SearchDatePicker({ queryIndex }) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { platform, startDate, endDate } = useSelector((state) => state.query[queryIndex]);

  const [isFromDateMatching, setIsFromDateMatching] = useState(true);
  const [isToDateMatching, setIsToDateMatching] = useState(true);

  // the minimum date off platform (From Date Picker)
  const fromDateMin = dayjs(earliestAllowedStartDate(platform)).format('MM/DD/YYYY');
  // the maximum date based off platform (From Date Picker)
  const fromDateMax = dayjs(latestAllowedEndDate(platform)).format('MM/DD/YYYY');

  // the minumum date off platform (To Date Picker)
  const toDateMin = dayjs(earliestAllowedStartDate(platform)).add(1, 'day').format('MM/DD/YYYY');
  // the maximum date off platform (To Date Picker)
  const toDateMax = dayjs(latestAllowedEndDate(platform)).format('MM/DD/YYYY');

  const handleChangeFromDate = (newValue) => {
    if (validateDate(dayjs(newValue), dayjs(fromDateMin), dayjs(fromDateMax))) {
      dispatch(setQueryProperty({ startDate: dayjs(newValue).format('MM/DD/YYYY'), queryIndex, property: 'startDate' }));
      setIsFromDateMatching(true);
    } else {
      setIsFromDateMatching(false);
    }
  };

  const handleChangeToDate = (newValue) => {
    if (validateDate(dayjs(newValue), dayjs(toDateMin), dayjs(toDateMax))) {
      dispatch(setQueryProperty({ endDate: dayjs(newValue).format('MM/DD/YYYY'), queryIndex, property: 'endDate' }));
      setIsToDateMatching(true);
    } else {
      setIsToDateMatching(false);
    }
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
          <div className="date-accuracy-alert">
            <h1 className={`banner ${isFromDateMatching ? 'disable-alert' : 'enable-alert'}`}>Invalid Date</h1>
            <DatePicker
              required
              type="date"
              label="From"
              value={startDate}
              onChange={handleChangeFromDate}
              disableFuture
              disableHighlightToday
              minDate={fromDateMin}
              maxDate={fromDateMax}
              renderInput={(params) => <TextField {...params} />}
            />
          </div>

          <div className="date-accuracy-alert">
            <h1 className={`banner ${isToDateMatching ? 'disable-alert' : 'enable-alert'}`}>Invalid Date</h1>
            <DatePicker
              required
              label="To"
              value={endDate}
              onChange={handleChangeToDate}
              disableFuture
              disableHighlightToday
              minDate={toDateMin}
              maxDate={toDateMax}
              renderInput={(params) => <TextField {...params} />}
            />
          </div>

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
