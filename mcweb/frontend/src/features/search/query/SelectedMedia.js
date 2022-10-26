import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { removeSelectedMedia } from './querySlice';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

export default function SelectedMedia() {
    const {collections} = useSelector(state => state.query);
    const dispatch = useDispatch();
    return(
        <div className='selected-media-container'>
            <h5>Selected Media</h5>
            <div>
                {collections.map(collection => {
                    return (
                    <div className='selected-media-item' key={`selected-media${collection.id}`}>
                        <div >{collection.name}</div>
                        <div onClick={()=> dispatch(removeSelectedMedia(collection.id))}>
                            <RemoveCircleIcon sx={{ color: '#d24527' }} />
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}