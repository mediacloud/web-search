import * as React from 'react';
import {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { addPreviewSelectedMedia, removePreviewSelectedMedia } from '../querySlice';
import { useLazyGetCollectionSearchQuery } from '../../../../app/services/searchApi';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

export default function CollectionSearchPicker(){
    const [query, setQuery] = useState('');
    const [trigger, {isLoading, isError, data, error}, lastPromiseInfo] = useLazyGetCollectionSearchQuery();
    const dispatch = useDispatch();
    const { previewCollections } = useSelector(state => state.query);

    const collectionIds = previewCollections.map(collection => collection.id);

    const inSelectedMedia = (collectionId) => {
        return collectionIds.includes(collectionId);
    };
    return(
        <div className='collection-search-picker-container'>
            {/* CollectionSearch */}
            <TextField size='large' sx={{marginTop:'1rem'}}label="Search Collection by Name"  value={query} onChange={e => setQuery(e.target.value)} />
            <Button  sx={{marginLeft:'1rem', marginTop:'1rem'}}variant='outlined' onClick={() => {
               trigger(query);
            }
                }>
                    Send Query
            </Button>
            {/* CollectionSearch results? */}
            {isLoading && (
                <div>Loading...</div>
            )}
            {data && (
                <div>
                    <h5>Results</h5>
                    <h6>{data.collections.length} Collections matching "{query}"</h6>
                    {data.collections.map(collection => {
                        return (
                            <div className='row collection-picker-item' key={collection.id}>
                                <h5 className='col-5'>{collection.name}</h5>
                                <h5 className='col-5'>{collection.notes}</h5>

                                {!(inSelectedMedia(collection.id)) && (
                                    <div className='col-2' onClick={() => dispatch(addPreviewSelectedMedia(collection))}>
                                        <AddCircleIcon sx={{ color: '#d24527' }} />
                                    </div>
                                )}
                                {(inSelectedMedia(collection.id)) && (
                                    <div className='col-2' onClick={() => dispatch(removePreviewSelectedMedia(collection.id))}>
                                        <RemoveCircleIcon sx={{ color: '#d24527' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}