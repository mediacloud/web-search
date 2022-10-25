import * as React from 'react';
import {useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FeaturedCollectionsPicker from './FeaturedCollectionsPicker';
import SelectedMediaPreview from '../SelectedMediaPreview';
import CollectionSearchPicker from './CollectionSearchPicker';
import { addSelectedMedia } from '../querySlice';
import { closeModal } from '../../../ui/uiSlice';

export default function MediaPicker() {
    const [tab, setTab] = useState('featuredCollections');
    const dispatch = useDispatch();
    const {previewCollections} = useSelector(state => state.query);
    return(
    <div className='media-picker-container'>
        <div className='media-picker-sidebar'>
            <div className='media-picker-tabs'>
                <button onClick={() => setTab('featuredCollections')}>Featured Collections</button>
                <button onClick={() => setTab('collectionSearch')}>Search Collections</button>
                <button onClick={() => setTab('sourceSearch')}>Search Sources</button>
            </div>
            <SelectedMediaPreview />
        </div>
        {tab === 'featuredCollections' && (
            <FeaturedCollectionsPicker />
        )}

        {tab === 'collectionSearch' && (
            // <FeaturedCollectionsPicker />
            <CollectionSearchPicker />
        )}
            
        {tab === 'sourceSearch' && (
            // <FeaturedCollectionsPicker />
            <h3>Sources search...under construction</h3>
        )}

        <button onClick={() => {
            dispatch(addSelectedMedia(previewCollections));
            dispatch(closeModal());
        }}>Confirm</button>

    </div>
    );

}