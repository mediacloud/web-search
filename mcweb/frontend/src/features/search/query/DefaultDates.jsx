/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { Link } from '@mui/material';
import PropTypes from 'prop-types';
import { setStartDate } from './querySlice';

export default function DefaultDates({ amountOfTime, typeOfTime, message }) {
  const dispatch = useDispatch();

  const {
    endDate,
  } = useSelector((state) => state.query);

  return (

    <Link
      underline="hover"
      component="button"
      variant="body2"
      sx={{ marginRight: 3 }}
      onClick={() => {
        const day = dayjs(endDate, 'MM-DD-YYYY').subtract(amountOfTime, typeOfTime).format('MM/DD/YYYY');

        dispatch(setStartDate(day));
      }}
    >
      {message}
    </Link>

  );
}

DefaultDates.propTypes = {
  amountOfTime: PropTypes.func.isRequired,
  typeOfTime: PropTypes.func.isRequired,
  message: PropTypes.func.isRequired,
};
