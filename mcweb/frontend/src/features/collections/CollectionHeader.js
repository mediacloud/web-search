import * as React from 'react';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionHeader(props){
    const { collectionId } = props
    const { 
        data,
        isLoading,
        isSuccess,
        isError,
        error,
     } = useGetCollectionQuery(collectionId);
    const collection = data;

    if (isLoading) return( <h1>Loading...</h1> )
    else {
        return (
            <div>
                <h1>{collection.name}</h1>
                <h3>Collection #{collectionId}</h3>
            </div>
        )
    }
};