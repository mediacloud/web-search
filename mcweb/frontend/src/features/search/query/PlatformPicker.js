import * as React from 'react';
import {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { setPlatform } from './querySlice';
import { closeModal } from '../../ui/uiSlice';
import LooksOneIcon from '@mui/icons-material/LooksOne';

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
                <div className='platform-title'>
                    <LooksOneIcon />
                    <h1 className='first-pick-title'>Choose your Media</h1>
                </div>
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
        < div className='second-pick-services' >
            <div className='platform-title'>
                <LooksOneIcon />
                <h1>Choose your Media</h1>
            </div>
         
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