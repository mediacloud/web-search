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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useState } from 'react';


// information from store
import { setSearch, selectTotalAttention } from '../search/searchSlice';
import { useSelector } from 'react-redux';

import { useGetSearchMutation } from '../../app/services/searchApi';

export default function Search() {

  const [serviceList, setServiceList] = useState([
    { service: "AI" },
    { service: "Rights" },
    { service: "Race" }
  ])

  const handleServiceAdd = () => {
    setServiceList([...serviceList, { service: "" }])
  }

  const handleServiceRemove = (index) => {
    const list = [...serviceList]
    list.splice(index, 1);
    setServiceList(list);
  }


  const handleServiceChange = (e, index) => {
    const { name, value } = e.target
    const list = [...serviceList];
    list[index][name] = value;
    setServiceList(list)
  }



  const [platform, setPlatform] = useState('Online News Archive');

  const handleChangePlatform = (event) => {
    setPlatform(event.target.value);
  };

  const [any, setAny] = useState("Any");

  const handleChangeAnyAll = (event) => {
    setAny(event.target.value);
  };


  function createQuery() {
    let query = "";
    let anyAll = "";

    if (any == "Any") {
      anyAll = "OR"
    } else {
      anyAll = "AND"
    }

    for (let i = 0; i < serviceList.length; i++) {
      if (i == serviceList.length - 1) {
        query += serviceList[i].service
      } else {
        query += serviceList[i].service + " " + anyAll + " "
      }
    }
    return query;
  }

  createQuery()
  return (
    <>

      <div className="searchTitle">
        <h1>Featured Collections</h1>
      </div>

      <div>
        <h1>Simple Search</h1>

        {/* Choose Platform  */}
        <div>
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
          <Select
            value={any}
            onChange={handleChangeAnyAll}
          >
            <MenuItem value={"Any"}>Any</MenuItem>
            <MenuItem value={"All"}>All</MenuItem>
          </Select>
        </div>


        <div className='form-field'>

          {serviceList.map((singleService, index) => (
            <div key={index} className='services'>

              <div className="firstDivision">
                <input name="service" type="text" id="service" required
                  value={singleService.service}
                  onChange={(e) => handleServiceChange(e, index)} />

                {serviceList.length - 1 === index && serviceList.length < 7 && (
                  <button
                    onClick={handleServiceAdd}
                    type="button"
                    className='add-btn'>
                    <span>Add a Service</span>
                  </button>
                )}
              </div>

              <div className="second-division">
                {serviceList.length > 1 &&
                  <button onClick={() => handleServiceRemove(index)} type="button" className='remove-btn'>
                    <span>Remove</span>
                  </button>
                }
              </div>
            </div>
          ))}
        </div>
        <h1> {createQuery()}</h1>
      </div>

    </>
  );
}