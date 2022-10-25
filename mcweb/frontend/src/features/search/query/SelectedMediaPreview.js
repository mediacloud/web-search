import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removePreviewSelectedMedia } from './querySlice';

export default function SelectedMediaPreview() {
    const { previewCollections } = useSelector(state => state.query);
    const dispatch = useDispatch();
    return (
        <div className='selected-media-container'>
            <h5>Selected Media</h5>
            <div>
                {previewCollections.map(collection => {
                    return (
                        <div className='selected-media-item' key={`selected-media-preview-${collection.id}`}>
                            <div >{collection.name}</div>
                            <button onClick={() => dispatch(removePreviewSelectedMedia(collection.id))}>X</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}