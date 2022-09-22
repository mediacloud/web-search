import * as React from 'react';
import {useSelector} from 'react-redux';

export default function MediaPicker() {
    const {tab} = useSelector(state => state.ui); 

    if (tab === 'featuredCollections'){
        return (
            <div className='media-picker-container'>
                This is in featuredCollections
            </div>

        );
    } else if (tab === 'collectionSearch'){
      return (
        <div className='media-picker-container'>
            This is in Collection Search
        </div>
      );
    } else {
        return (
            <div className='media-picker-container'>
                This is in Source Search
            </div>
        );
    }


}