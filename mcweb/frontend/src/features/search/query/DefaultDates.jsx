/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import { setQueryProperty } from './querySlice';
import { latestAllowedEndDate } from '../util/platforms';

export default function DefaultDates({
  amountOfTime, typeOfTime, message, platform, queryIndex,
}) {
  const dispatch = useDispatch();

  return (
    <Button
      variant="outlined"
      sx={{ marginRight: 3 }}
      onClick={() => {
        // get last possible endDate per platform
        const endDate = latestAllowedEndDate(platform).format('MM/DD/YYYY');
        // substract the amount of time per type of time (month)
        const startDate = dayjs(endDate, 'MM-DD-YYYY').subtract(amountOfTime, typeOfTime).format('MM/DD/YYYY');

        // dispatch startDate
        dispatch(setQueryProperty({ startDate, queryIndex, property: 'startDate' }));

        // dispatch endDate
        dispatch(setQueryProperty({ endDate, queryIndex, property: 'endDate' }));
      }}
    >
      {message}
    </Button>
  );
}

DefaultDates.propTypes = {
  amountOfTime: PropTypes.string.isRequired,
  typeOfTime: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  platform: PropTypes.string.isRequired,
  queryIndex: PropTypes.number.isRequired,
};
