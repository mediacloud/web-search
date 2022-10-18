import * as React from 'react';
import {useState} from 'react';
import QueryList from './QueryList';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { setQueryList, setNegatedQueryList} from './querySlice';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import {useSelector} from 'react-redux';

export default function SimpleSearch () {

    const [any, setAny] = useState("Any");

    const handleChangeAnyAll = (event) => {
        setAny(event.target.value);
    };

    const {platform} = useSelector(state => state.query);

    // determines what to give List.js as a parameter from state
    const queryLogic = () => {
        if (any == "Any") {
            if (platform === "Online News Archive" || platform === "Twitter"){
                return "OR";
            }else if (platform === "Reddit" || platform === "Youtube"){
                return "|";
            }
            
        } else {
            if (platform === "Online News Archive") {
                return "AND";
            } else if (platform === "Twitter" || platform === "Youtube") {
                return " ";
            } else if (platform === "Reddit"){
                return "+";
            }
        }
    };

    const negatedQueryLogic = () => {
        if (platform === "Online News Archive") {
            return "OR";
        } else {
            return "-";
        }
    };


    const queryListProps = {
        logic: queryLogic(),
        action: { setQueryList },
    };

    const negatedListProps = {

        logic: negatedQueryLogic(),
        action: { setNegatedQueryList }
    };

    return(
    <div className='simple-search-container'>
        <div className='query-term-container'>
            <div className='simple-search-title'>
                <LooksTwoIcon />
                <h1>Enter Your Search Terms</h1>
            </div>

          <div className='select-any-all'>
            <Select
                value={any}
                onChange={handleChangeAnyAll}
            >
                <MenuItem value={"Any"}>Any</MenuItem>
                <MenuItem value={"All"}>All</MenuItem>
            </Select>
            <h1 className='select-title'>of these Phrases</h1>
          </div>
       
            <QueryList props={queryListProps}/>

        </div>

        <div className='negated-query-list'>
            <h1 className='negations-title'>And none of these phrases</h1>

            {/* Negation List */}
            <QueryList props={negatedListProps} />
        </div>

    </div>
    );
}