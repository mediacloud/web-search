import * as React from 'react';
import { useGetFeaturedCollectionsQuery } from '../../../app/services/collectionsApi';
import {useSelector, useDispatch} from 'react-redux';
import { addSelectedMedia } from '../querySlice';

export default function FeaturedCollectionsPicker () {
    const {data, isLoading} = useGetFeaturedCollectionsQuery();
    const dispatch = useDispatch();

    if (isLoading){
        return (<div>Loading...</div>);
    } else {
        return(
            <div className='featured-collections-picker-container'>
                {data.collections.map(collection => {
                  return( 
                    <div className='collection-picker-item' key={collection.id}>
                        <h5>{collection.name}</h5>
                        {/* <h5>Category</h5> */}
                        <h5>{collection.notes}</h5>
                        {/* collection.id in selectedMedia collections ? X (remove from selected media) : + (add to SM) */}
                        <button onClick={() => dispatch(addSelectedMedia(collection)) }>+</button>
                   </div>
                   );
                })}
            </div>
        );
    }
}