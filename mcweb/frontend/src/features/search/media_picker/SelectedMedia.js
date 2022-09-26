import * as React from 'react';
import {useSelector} from 'react-redux';

export default function SelectedMedia() {
    const {collections} = useSelector(state => state.query);
    console.log(collections);
    return(
        <div className='selected-media-container'>
            <h5>Selected Media</h5>
            <ul>
                {collections.map(collection => {
                    return (
                    <div key={`selected-media${collection.id}`}>
                        <li>{collection.name}</li>
                    </div>
                    );
                })}
            </ul>
        </div>
    );
}