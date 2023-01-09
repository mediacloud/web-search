import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { setStartDate, setEndDate } from './querySlice';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { Link } from "@mui/material";

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
        const day = dayjs(endDate, "MM-DD-YYYY").subtract(amountOfTime, typeOfTime).format('MM/DD/YYYY');

        dispatch(setStartDate(day));

      }}
    >
      {message}
    </Link>


  )

}