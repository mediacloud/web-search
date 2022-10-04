import * as React from 'react';
import {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { addSelectedMedia, removeSelectedMedia } from '../querySlice';
import { useLazyGetCollectionSearchQuery } from '../../../app/services/searchApi';

export default function CollectionSearchPicker(){
    const [query, setQuery] = useState('');
    const [trigger, {isLoading, isError, data, error}, lastPromiseInfo] = useLazyGetCollectionSearchQuery();
    const dispatch = useDispatch();
    const { collections } = useSelector(state => state.query);

    const collectionIds = collections.map(collection => collection.id);

    const inSelectedMedia = (collectionId) => {
        return collectionIds.includes(collectionId);
    };
    return(
        <div className='collection-search-picker-container'>
            {/* CollectionSearch */}
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
            <div onClick={() => {
               trigger(query);
            }
                }>
                    Send Query
            </div>
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
                            <div className='collection-result-item' key={collection.id}>
                                <p>{collection.name}</p>
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
            )}
        </div>
    );
}