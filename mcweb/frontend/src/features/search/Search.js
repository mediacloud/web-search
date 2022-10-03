
import DateChooser from './DateChooser';


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

  const [any, setAny] = useState("Any");

  const handleChangeAnyAll = (event) => {
    setAny(event.target.value);
  };


  // determines what to give List.js as a parameter from state
  function propsLogic() {
    if (any == "Any") {
      return "OR"
    } else {
      return "AND"
    }
  }

  return (

    <>

      {/* Choose any platform  */}
      <div className='services'>
        <h1>Choose your Media</h1>
        <Select
          value={platform}
          onChange={handleChangePlatform}
        >
          <MenuItem value={"Online News Archive"}>Online News Archive</MenuItem>
          <MenuItem value={"Reddit"}>Reddit</MenuItem>
          <MenuItem value={"Twitter"}>Twitter</MenuItem>
          <MenuItem value={"Youtube"}>Youtube</MenuItem>
        </Select>
      </div>

      {/* Choose Query Type */}


      <div>
        <div className='services'>
          <h1>Match</h1>
          <Select
            value={any}
            onChange={handleChangeAnyAll}
          >
            <MenuItem value={"Any"}>Any</MenuItem>
            <MenuItem value={"All"}>All</MenuItem>
          </Select>
          <h1>of these Phrases</h1>


        </div>
        <List props={propsLogic()} />

      </div>

    

      <h1>And none of these phrases</h1>

      {/* Negation List */}
      {/* Always 'AND OR' */}
      <List props="AND OR" />

    
    {/* From Date */}
    <div>
      <h1>From Date: </h1>
        <DateChooser props="From"/>
    </div>

    <div>
      <h1>To Date: </h1>
      <DateChooser props="To"/>
    </div>


    </>

  );
}