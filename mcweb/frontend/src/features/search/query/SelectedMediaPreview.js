import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removePreviewSelectedMedia } from './querySlice';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';

export default function SelectedMediaPreview() {
    const { previewCollections } = useSelector(state => state.query);
    const dispatch = useDispatch();
    return (
        <div className='selected-media-container'>
            <h4>Selected Media</h4>
            <div>
                {previewCollections.map(collection => {
                    return (
                        <div className='selected-media-item' key={`selected-media-preview-${collection.id}`}>
                            <h6 >{collection.name}</h6>
                            <div onClick={() => dispatch(removePreviewSelectedMedia(collection.id))}>
                                <RemoveCircleIcon sx={{ color: '#d24527' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}