/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { Link } from '@mui/material';
import PropTypes from 'prop-types';
import { setQueryProperty, setQueryPropertyPartDuex } from './querySlice';
import { latestAllowedEndDate } from '../util/platforms';

export default function DefaultDates({
  amountOfTime, typeOfTime, message, platform,
}) {
  const dispatch = useDispatch();

  const endDate = latestAllowedEndDate(platform);
  return (

    <Link
      underline="hover"
      component="button"
      variant="body2"
      sx={{ marginRight: 3 }}
      onClick={() => {
        dispatch(setQueryProperty({ endDate: endDate.format('MM/DD/YYYY') }));

        const day = dayjs(endDate, 'MM-DD-YYYY').subtract(amountOfTime, typeOfTime).format('MM/DD/YYYY');

        dispatch(setQueryProperty({ startDate: day }));
      }}
    >
      {message}
    </Link>

  );
}

DefaultDates.propTypes = {
  amountOfTime: PropTypes.string.isRequired,
  typeOfTime: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  platform: PropTypes.string.isRequired,
};
