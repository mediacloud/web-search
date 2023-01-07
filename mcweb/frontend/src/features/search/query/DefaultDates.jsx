import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setStartDate, setEndDate } from './querySlice';
import dayjs from 'dayjs';
import { latestAllowedEndDate } from '../util/platforms';
import { useSnackbar } from 'notistack';

import { Link } from '@mui/material';


export default function DefaultDates() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { platform, startDate, endDate } = useSelector((state) => state.query);



  // useEffect( () => {
  // dispatch(setStartDate()
  // 
  // }, [platform])



  return (
    <>

      <Link
        underline="hover"
        component="button"
        variant="body2"
        sx={{ marginRight: 3 }}

        onClick={() => {

          const month = endDate.substring(0, 2) - 1;
          const day = endDate.substring(3, 5);
          const year = endDate.substring(6);


          const datet = dayjs(new Date(year, month, day)).subtract(1, 'month').format('MM/DD/YYYY');



        }}
      >
        Last Month
      </Link>

      <Link
        underline="hover"
        component="button"
        variant="body2"
        sx={{ marginRight: 3 }}

        onClick={() => {

        }}
      >
        Last 3 Months
      </Link>

      <Link
        underline="hover"
        component="button"
        variant="body2"
        sx={{ marginRight: 3 }}

        onClick={() => {
          console.log("I'm a button.");
        }}
      >
        Last Year
      </Link>
    </>
  );
}
