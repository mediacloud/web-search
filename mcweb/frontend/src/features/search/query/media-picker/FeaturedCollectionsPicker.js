import * as React from 'react';
import { useGetFeaturedCollectionsQuery } from '../../../../app/services/collectionsApi';
import {useSelector, useDispatch} from 'react-redux';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

export default function FeaturedCollectionsPicker () {
    const {data, isLoading} = useGetFeaturedCollectionsQuery();
    const dispatch = useDispatch();

    const { previewCollections } = useSelector(state => state.query);

    const collectionIds = previewCollections.map(collection => collection.id);

    const inSelectedMedia = (collectionId) => {
        return collectionIds.includes(collectionId);
    };

    if (isLoading){
        return (<div>Loading...</div>);
    } else {
        return(
            <div className='container featured-collections-container'>
                <div className='row'>
                    <div className='col-5'>Name</div>
                    <div className='col-7'>Description</div>
                </div>
                {data.collections.map(collection => {
                  return( 
                    <div className='row collection-picker-item' key={collection.id}>
                        <h5 className='col-5'>{collection.name}</h5>
                        <h5 className='col-5'>{collection.notes}</h5>

                        {!(inSelectedMedia(collection.id)) && (   
                            <div className='col-2' onClick={() => dispatch(addPreviewSelectedMedia(collection))}>
                                  <AddCircleIcon sx={{ color:'#d24527'}}  />
                            </div>                             
                        )}
                        {(inSelectedMedia(collection.id)) && (
                                <div className='col-2' onClick={() => dispatch(removePreviewSelectedMedia(collection.id))}>
                                  <RemoveCircleIcon sx={{ color:'#d24527'}} />
                            </div>
                        )}
                   </div>
                   );
                })}
            </div>
        );
    }
}