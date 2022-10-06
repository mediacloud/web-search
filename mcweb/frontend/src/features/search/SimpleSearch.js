import * as React from 'react';
import {useState} from 'react';
import List from './List';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { setQueryList, setNegatedQueryList} from './querySlice';


export default function SimpleSearch () {

    const [any, setAny] = useState("Any");

    const handleChangeAnyAll = (event) => {
        setAny(event.target.value);
    };

    // determines what to give List.js as a parameter from state
    const logic = () => {
        if (any == "Any") {
            return "OR";
        } else {
            return "AND";
        }
    };


    const queryListProps = {
        logic: logic(),
        action: { setQueryList },
    };

    const negatedListProps = {
        logic: "AND OR",
        action: { setNegatedQueryList }
    };

    return(
    <div>
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
        
       
        <List props={queryListProps}/>

        </div>

        <h1>And none of these phrases</h1>

    {/* Negation List */ }
    {/* Always 'AND OR' */ }
        <List props={negatedListProps} />
    </div>
    );
}