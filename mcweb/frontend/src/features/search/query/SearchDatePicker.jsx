/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { setQueryProperty } from './querySlice';
import { earliestAllowedStartDate, latestAllowedEndDate } from '../util/platforms';
import validateDate from '../util/dateValidation';
import DefaultDates from './DefaultDates';
import isQueryStateEmpty from '../util/isQueryStateEmpty';
import getEarliestAvailableDate from '../util/dateHelpers';

export default function SearchDatePicker({ queryIndex }) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { earliestAvailableDate } = document.settings;
  const {
    platform, startDate, endDate, isFromDateValid, isToDateValid,
  } = useSelector((state) => state.query[queryIndex]);

  const queryState = useSelector((state) => state.query);

  // the minimum date off platform (From Date Picker)
  const fromDateMin = dayjs(earliestAllowedStartDate(platform)).format('MM/DD/YYYY');
  // the maximum date based off platform (From Date Picker)
  const fromDateMax = dayjs(latestAllowedEndDate(platform)).format('MM/DD/YYYY');
  // the minumum date off platform (To Date Picker)
  const toDateMin = dayjs(earliestAllowedStartDate(platform)).format('MM/DD/YYYY');
  // the maximum date off platform (To Date Picker)
  const toDateMax = dayjs(latestAllowedEndDate(platform)).format('MM/DD/YYYY');

  // handler for the fromDate MUI DatePicker
  const handleChangeFromDate = (newValue) => {
    if (validateDate(dayjs(newValue), dayjs(fromDateMin), dayjs(fromDateMax))) {
      // if the fromDate is valid, we are going to make this change in state and set the isFromDateValid to true
      dispatch(setQueryProperty({ isFromDateValid: true, queryIndex, property: 'isFromDateValid' }));
      dispatch(setQueryProperty({ startDate: dayjs(newValue).format('MM/DD/YYYY'), queryIndex, property: 'startDate' }));
    } else {
      // we do not save the invalid date, if a user goes onto another tab, the previously valid date will be presented
      // if the date is invalid, we are going to set isToDateValid to false because the date provided is not valid
      dispatch(setQueryProperty({ isFromDateValid: false, queryIndex, property: 'isFromDateValid' }));
    }
  };

  // handler for the toDate MUI DatePicker
  const handleChangeToDate = (newValue) => {
    if (validateDate(dayjs(newValue), dayjs(toDateMin), dayjs(toDateMax))) {
      // if the toDate is valid, we are going to make this change in state and set the isToDateValid to true
      dispatch(setQueryProperty({ isToDateValid: true, queryIndex, property: 'isToDateValid' }));
      dispatch(setQueryProperty({ endDate: dayjs(newValue).format('MM/DD/YYYY'), queryIndex, property: 'endDate' }));
    } else {
      // we do not save the invalid date, if a user goes onto another tab, the previously valid date will be presented
      // if the date is invalid, we are going to set isToDateValid to false because the date provided is not valid
      dispatch(setQueryProperty({ isToDateValid: false, queryIndex, property: 'isToDateValid' }));
    }
  };

  // if the platform changes, we want to update the validity of the dates
  useEffect(() => {
    // if the queries are empty, change the end date to the latest allowed end date per the platform
    if (isQueryStateEmpty(queryState)) {
      handleChangeToDate(latestAllowedEndDate(platform));
    }

    // if the endDate is after than the latest allowed end date, change the end date to the latest allowed date
    if (dayjs(endDate) > dayjs(toDateMax)) {
      handleChangeToDate(latestAllowedEndDate(platform));
      enqueueSnackbar('We changed your end date to match this platform limit', { variant: 'warning' });
    }
    // if the endDate is earlier than the earliest allowed start date, change the start date to the earliest allowed date
    if (dayjs(startDate) < dayjs(fromDateMin)) {
      handleChangeFromDate(earliestAllowedStartDate(platform));
      enqueueSnackbar('We changed your start date to match this platform limit', { variant: 'warning' });
    }
    // we don't save invalid dates, so going into another tab would leave these set to false and a correct date
    dispatch(setQueryProperty({ isToDateValid: true, queryIndex, property: 'isToDateValid' }));
    dispatch(setQueryProperty({ isFromDateValid: true, queryIndex, property: 'isFromDateValid' }));
  }, [platform]);

  return (
    <>
      <Alert severity="warning">
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        Reingest of historical data in progress. Search results available from present back to {getEarliestAvailableDate(earliestAvailableDate)}
      </Alert>
      <div className="date-picker-wrapper local-provider">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <div className="date-accuracy-alert">
            <h1 className={`banner ${isFromDateValid ? 'disable-alert' : 'enable-alert'}`}>Invalid Date</h1>
            <DatePicker
              required
              type="date"
              label="From"
              value={startDate}
              onChange={handleChangeFromDate}
              disableFuture
              disableHighlightToday
              minDate={dayjs(fromDateMin).toDate()}
              maxDate={dayjs(fromDateMax).toDate()}
              renderInput={(params) => <TextField {...params} />}
            />
          </div>

          <div className="date-accuracy-alert">
            <h1 className={`banner ${isToDateValid ? 'disable-alert' : 'enable-alert'}`}>Invalid Date</h1>
            <DatePicker
              required
              label="To"
              value={endDate}
              onChange={handleChangeToDate}
              disableFuture
              disableHighlightToday
              minDate={dayjs(toDateMin).toDate()}
              maxDate={dayjs(toDateMax).toDate()}
              renderInput={(params) => <TextField {...params} />}
            />
          </div>

        </LocalizationProvider>
      </div>
      <p className="help">
        Each platform has different limitations on how recent your search can be.
        The start and end dates are inclusive.
      </p>

      <DefaultDates platform={platform} amountOfTime="1" typeOfTime="month" message="Last Month" queryIndex={queryIndex} />

      <DefaultDates platform={platform} amountOfTime="3" typeOfTime="month" message="Last 3 Months" queryIndex={queryIndex} />
    </>
  );
}

SearchDatePicker.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
