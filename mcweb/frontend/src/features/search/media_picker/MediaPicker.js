import * as React from 'react';
import {useState} from 'react';


export default function MediaPicker() {
    const [tab, setTab] = useState('featuredCollections');

    if (tab === 'featuredCollections'){
        return (
            <div className='media-picker-container'>
                This is in featuredCollections
                {/*  */}
                <button onClick={() => setTab('collectionSearch')}> Change to Collection Search</button>
            </div>

        );
    } else if (tab === 'collectionSearch'){
      return (
        <div className='media-picker-container'>
            This is in Collection Search
        </div>
      );
    }


}