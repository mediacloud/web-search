import * as React from 'react';
import {useState} from 'react';
import FeaturedCollectionsPicker from './FeaturedCollectionsPicker';
import SelectedMedia from './SelectedMedia';
import CollectionSearchPicker from './CollectionSearchPicker';

export default function MediaPicker() {
    const [tab, setTab] = useState('featuredCollections');
    return(
    <div className='media-picker-container'>
        <div className='media-picker-sidebar'>
            <div className='media-picker-tabs'>
                <button onClick={() => setTab('featuredCollections')}>Featured Collections</button>
                <button onClick={() => setTab('collectionSearch')}>Search Collections</button>
                <button onClick={() => setTab('sourceSearch')}>Search Sources</button>
            </div>
            <SelectedMedia />
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
            <h3>Sources srach</h3>
        )}

    </div>);

}