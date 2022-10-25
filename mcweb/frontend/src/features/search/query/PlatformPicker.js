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

    const PLATFORM_TWITTER = 'twitter';
    const PLATFORM_REDDIT = 'reddit';
    const PLATFORM_YOUTUBE = 'youtube';
    const PLATFORM_ONLINE_NEWS = 'onlinenews';

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
                    <MenuItem value={PLATFORM_ONLINE_NEWS}>Online News Archive</MenuItem>
                    <MenuItem value={PLATFORM_REDDIT}>Reddit</MenuItem>
                    <MenuItem value={PLATFORM_TWITTER}>Twitter</MenuItem>
                    <MenuItem value={PLATFORM_YOUTUBE}>Youtube</MenuItem>
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
           <MenuItem value={PLATFORM_ONLINE_NEWS}>Online News Archive</MenuItem>
           <MenuItem value={PLATFORM_REDDIT}>Reddit</MenuItem>
           <MenuItem value={PLATFORM_TWITTER}>Twitter</MenuItem>
           <MenuItem value={PLATFORM_YOUTUBE}>Youtube</MenuItem>
         </Select>
      </div >
    );
}

// # static list matching topics / info results
// PLATFORM_TWITTER = 'twitter'
// PLATFORM_REDDIT = 'reddit'
// PLATFORM_YOUTUBE = 'youtube'
// PLATFORM_ONLINE_NEWS = 'onlinenews'

// # static list matching topics / info results
// PLATFORM_SOURCE_PUSHSHIFT = 'pushshift'
// PLATFORM_SOURCE_TWITTER = 'twitter'
// PLATFORM_SOURCE_YOUTUBE = 'youtube'
// PLATFORM_SOURCE_MEDIA_CLOUD = 'mediacloud'
// PLATFORM_SOURCE_WAYBACK_MACHINE = 'waybackmachine'