import * as React from 'react';
import {useState, useEffect} from 'react';
import { useGetFeaturedCollectionsQuery } from '../../../app/services/collectionsApi';

export default function CollectionSearchPicker(){
    const [query, setQuery] = useState('');
    const [toggle, setToggle] = useState(false);
    const [skip, setSkip] = useState(true);
    const { data } = useGetFeaturedCollectionsQuery(query, {skip});

    return(
        <div className='collection-search-picker-container'>
            {/* CollectionSearch */}
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
            <div onClick={() => {
                setSkip(!skip);
            }
                }>
                    Send It
            </div>
            {/* CollectionSearch results? */}
            <div>

            </div>
        </div>
    );
}