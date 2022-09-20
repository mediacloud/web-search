import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import Container from '@mui/material/Container';


import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useState } from 'react';


// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { useSelector } from 'react-redux';

import { useGetSearchMutation } from '../../app/services/searchApi';

export default function Search() {

 
  // YYYY - MM - DD
  function createDate() {
    const today = new Date()
    return today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate()
  }

  const [platform, setPlatform] = useState('Online News Archive');

  const handleChangePlatform = (event) => {
    setPlatform(event.target.value);
  };

  console.log(platform)
  return (
    <>

      <div className="searchTitle">
        <h1>Featured Collections</h1>
      </div>

      <div>
        <h1>Simple Search</h1>

          <InputLabel>Platform</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            value={platform}
            label="Platform"
            onChange={handleChangePlatform}
          >
            <MenuItem value={"Online News Archive"}>Online News Archive</MenuItem>
            <MenuItem value={"Reddit"}>Reddit</MenuItem>
            <MenuItem value={"Twitter"}>Twitter</MenuItem>
            <MenuItem value={"Youtube"}>Youtube</MenuItem>
          </Select>

      
      </div>

    </>
  );
}