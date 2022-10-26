import * as React from 'react';
import {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { setPlatform } from './querySlice';
import { closeModal } from '../../ui/uiSlice';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

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
    const [open, setOpen] = useState(true);
    if (platform === "Choose a Platform"){
        return (
            <div>
                {/* <Button variant="outlined" onClick={handleClickOpen}>
                    Open form dialog
                </Button> */}
                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>Choose A Platform</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            First, Choose a Platform to query against.
                        </DialogContentText>
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
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={()=> setOpen(false)}>Cancel</Button>
                    </DialogActions>
                </Dialog>
            </div>
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
