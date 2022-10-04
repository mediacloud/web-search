import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useState } from 'react';


// information from store
import { useSelector } from 'react-redux';

import { setQueryList, setNegatedQueryList } from '../search/searchSlice';

import { useDispatch } from 'react-redux';

import { useGetSearchMutation } from '../../app/services/searchApi';

export default function List(props) {
  const dispatch = useDispatch();
  
  //logical operator
  const logic = props.props.logic;

  // possible actions
  const setQueryList = props.props.action.setQueryList;
  const setNegatedList = props.props.action.setNegatedQueryList;

  // list of actions
  const functions = [setQueryList, setNegatedList];

  // initialize the action on which is true
  let action = null;
  functions.map( func => {
    if(func != null) {
      action = func;
    }
  });


  const [serviceList, setServiceList] = useState([
    { service: "" },
  ]);

  // dispatches the query to the store using the action 
  React.useEffect(() => {
    dispatch(action(createQuery()));
  }, [serviceList]);


  // add query 
  const handleServiceAdd = () => {
    setServiceList([...serviceList, { service: "" }]);
  };

  // remove query
  const handleServiceRemove = (index) => {
    const list = [...serviceList];
    list.splice(index, 1);
    setServiceList(list);
  };

  // handle changes to query
  const handleQueryChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...serviceList];
    list[index][name] = value;
    setServiceList(list);
  };

  // creates query
  function createQuery() {
    let query = "";
    for (let i = 0; i < serviceList.length; i++) {
      if (i == serviceList.length - 1) {
        query += serviceList[i].service;
      } else {
        query += serviceList[i].service + " " + logic + " ";
      }
    }
    return query;
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
                <span>Add a Query Term</span>
              </button>
            )}
          </div>

          <div className="second-division">
            {serviceList.length > 1 &&
              <button onClick={() => handleServiceRemove(index)} type="button" className='remove-btn'>
                <span>Remove Query Term</span>
              </button>
            }
          </div>
        </div>
      ))}
    </div>

  );
}