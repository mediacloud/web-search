import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setStartDate, setEndDate } from './querySlice';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import urlSerializer from '../util/urlSerializer';
import { searchApi } from '../../../app/services/searchApi';
import { setSearchTime } from './querySlice';

import { latestAllowedEndDate } from '../util/platforms';
import { useSnackbar } from 'notistack';

import { Link } from '@mui/material';


export default function DefaultDates() {
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const {
    queryString,
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    collections,
    sources,
    platform,
    anyAll,
    advanced,
  } = useSelector((state) => state.query);

  const queryObject = {
    queryList,
    negatedQueryList,
    queryString,
    startDate,
    endDate,
    platform,
    collections,
    sources,
    anyAll,
    advanced,
  };
  
  return (
    <>

    <h1>Hello</h1>

    </>
  );
}
