import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import Container from '@mui/material/Container';


import List from './List';
import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useState } from 'react';


// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { useSelector } from 'react-redux';

import { useGetSearchMutation } from '../../app/services/searchApi';

export default function Search() {

  const [platform, setPlatform] = useState('Online News Archive');

  const handleChangePlatform = (event) => {
    setPlatform(event.target.value);
  };

  const [any, setAny] = useState("AND");

  const handleChangeAnyAll = (event) => {
    setAny(event.target.value);
  };


  // function createQuery() {
  //   let query = "";
  //   let anyAll = "";

  //   if (any == "Any") {
  //     anyAll = "OR"
  //   } else {
  //     anyAll = "AND"
  //   }

  //   for (let i = 0; i < serviceList.length; i++) {
  //     if (i == serviceList.length - 1) {
  //       query += serviceList[i].service
  //     } else {
  //       query += serviceList[i].service + " " + anyAll + " "
  //     }
  //   }
  //   return query;
  // }

  // createQuery()
  return (

    <div>
       {/* regular list */}
      <List props={any} />

      {/*  negation list */}
      <List props="AND NOT" />
    </div>

  );
}