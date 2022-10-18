import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import { removeSelectedMedia } from './querySlice';

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
                        <button onClick={()=> dispatch(removeSelectedMedia(collection.id))}>X</button>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}