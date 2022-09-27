import * as React from 'react';
import { useGetFeaturedCollectionsQuery } from '../../../app/services/collectionsApi';
import {useSelector, useDispatch} from 'react-redux';
import { addSelectedMedia, removeSelectedMedia } from '../querySlice';

export default function FeaturedCollectionsPicker () {
    const {data, isLoading} = useGetFeaturedCollectionsQuery();
    const dispatch = useDispatch();

    const { collections } = useSelector(state => state.query);

    const collectionIds = collections.map(collection => collection.id);

    const inSelectedMedia = (collectionId) => {
        return collectionIds.includes(collectionId);
    };

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

                        {!(inSelectedMedia(collection.id)) && (
                            <button onClick={() => dispatch(addSelectedMedia(collection))}>
                                +
                            </button>
                        )}

                        {(inSelectedMedia(collection.id)) && (
                            <button onClick={() => dispatch(removeSelectedMedia(collection.id))}>
                                X
                            </button>
                        )}
                   </div>
                   );
                })}
            </div>
        );
    }
}