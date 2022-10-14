import * as React from 'react';
import {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { setPlatform } from '../querySlice';
import { closeModal } from '../../ui/uiSlice';

export default function PlatformPicker (){
    const {platform} = useSelector(state => state.query);
    const dispatch = useDispatch();

    const handleChangePlatform = (event) => {
        dispatch(setPlatform(event.target.value));
        dispatch(closeModal());
    };

    if (platform === "Choose a Platform"){
        return(
            < div className='first-pick-services' >
                <h1>First, Choose a platform to query against</h1>
                <Select
                    value={"Choose A Platform"}
                    onChange={handleChangePlatform}
                >
                    <MenuItem defaultValue={true} disabled={true} value={"Choose A Platform"}>Choose A Platform</MenuItem>
                    <MenuItem value={"Online News Archive"}>Online News Archive</MenuItem>
                    <MenuItem value={"Reddit"}>Reddit</MenuItem>
                    <MenuItem value={"Twitter"}>Twitter</MenuItem>
                    <MenuItem value={"Youtube"}>Youtube</MenuItem>
                </Select>
            </div >
        );
    }

    return(
        < div className = 'services' >
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
      </div >
    );
}