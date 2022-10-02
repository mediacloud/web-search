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

export default function List(props) {
  console.log(props)

  const [serviceList, setServiceList] = useState([
    { service: "AI" },
    { service: "Work" },
  ])

  const handleServiceAdd = () => {
    setServiceList([...serviceList, { service: "" }])
  }

  const handleServiceRemove = (index) => {
    const list = [...serviceList]
    list.splice(index, 1);
    setServiceList(list);
  }

  const handleQueryChange = (e, index) => {
    const { name, value } = e.target
    const list = [...serviceList];
    list[index][name] = value;
    setServiceList(list)
  }


  return (
    <div>
      {serviceList.map((singleService, index) => (
        <div key={index} className='services'>

          <div className="firstDivision">
            <input name="service" type="text" id="service" required
              value={singleService.service}
              onChange={(e) => handleQueryChange(e, index)} />

            {serviceList.length - 1 === index && (
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
  )
}