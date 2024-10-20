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
import { earliestAllowedStartDate, latestAllowedEndDate, PROVIDER_NEWS_MEDIA_CLOUD } from '../util/platforms';
import validateDate from '../util/dateValidation';
import DefaultDates from './DefaultDates';
import isQueryStateEmpty from '../util/isQueryStateEmpty';

export default function SearchDatePicker({ queryIndex }) {
  // US format date (use "L" format w/ dayjs LocalizedFormat?)
  const dateFormat = 'MM/DD/YYYY';

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const {
    platform, startDate, endDate, isFromDateValid, isToDateValid,
  } = useSelector((state) => state.query[queryIndex]);

  const queryState = useSelector((state) => state.query);

  // the minimum/maximum dates based on platform for both From and To dates
  // XXX does this get reexcuted when platform changes???
  const minDJS = earliestAllowedStartDate(platform); // dayjs
  const maxDJS = latestAllowedEndDate(platform);     // dayjs

  // handler for the fromDate MUI DatePicker
  const handleChangeFromDate = (newValue) => {
    const newDJS = dayjs(newValue);
    if (validateDate(newDJS, minDJS, maxDJS)) {
      // if the fromDate is valid, we are going to make this change in state and set the isFromDateValid to true
      dispatch(setQueryProperty({ isFromDateValid: true, queryIndex, property: 'isFromDateValid' }));
      dispatch(setQueryProperty({ startDate: newDJS.format(dateFormat), queryIndex, property: 'startDate' }));
    } else {
      // we do not save the invalid date, if a user goes onto another tab, the previously valid date will be presented
      // if the date is invalid, we are going to set isToDateValid to false because the date provided is not valid
      dispatch(setQueryProperty({ isFromDateValid: false, queryIndex, property: 'isFromDateValid' }));
    }
  };

  // handler for the toDate MUI DatePicker
  const handleChangeToDate = (newValue) => {
    const newDJS = dayjs(newValue);
    if (validateDate(newDJS, minDJS, maxDJS)) {
      // if the toDate is valid, we are going to make this change in state and set the isToDateValid to true
      dispatch(setQueryProperty({ isToDateValid: true, queryIndex, property: 'isToDateValid' }));
      dispatch(setQueryProperty({ endDate: newDJS.format(dateFormat), queryIndex, property: 'endDate' }));
    } else {
      // we do not save the invalid date, if a user goes onto another tab, the previously valid date will be presented
      // if the date is invalid, we are going to set isToDateValid to false because the date provided is not valid
      dispatch(setQueryProperty({ isToDateValid: false, queryIndex, property: 'isToDateValid' }));
    }
  };

  // if the platform changes, we want to update the validity of the dates
  useEffect(() => {
    const {
      collections,
      sources,
      advanced,
      platform,
    } = queryState;

    // if the queries are empty, change the end date to the latest allowed end date per the platform
    if (isQueryStateEmpty(queryState)) {
      handleChangeToDate(maxDJS);
    }

    // if the endDate is after than the latest allowed end date, change the end date to the latest allowed date
    if (dayjs(endDate) > maxDJS) {
      handleChangeToDate(maxDJS);
      enqueueSnackbar('We changed your end date to match this platform limit', { variant: 'warning' });
    }
    // if the endDate is earlier than the earliest allowed start date, change the start date to the earliest allowed date
    if (dayjs(startDate) < minDJS) {
      handleChangeFromDate(minDJS);
      enqueueSnackbar('We changed your start date to match this platform limit', { variant: 'warning' });
    }
    // we don't save invalid dates, so going into another tab would leave these set to false and a correct date
    dispatch(setQueryProperty({ isToDateValid: true, queryIndex, property: 'isToDateValid' }));
    dispatch(setQueryProperty({ isFromDateValid: true, queryIndex, property: 'isFromDateValid' }));
  }, [platform]);

  return (
    <>
      {platform === PROVIDER_NEWS_MEDIA_CLOUD && (
        <Alert severity="warning">
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          Reingest of historical data in progress. Search results available from present back to {minDJS.format(dateFormat)}
        </Alert>
      )}
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
              minDate={minDJS.toDate()}
              maxDate={maxDJS.toDate()}
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
              minDate={minDJS.toDate()}
              maxDate={maxDJS.toDate()}
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
