import * as React from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionHeader(props) {
    const { collectionId } = props
    const {
        data,
        isLoading,
        isSuccess,
        isError,
        error,
    } = useGetCollectionQuery(collectionId);
    const collection = data;

    if (isLoading) return (<h1>Loading...</h1>)
    else {
        return (
            <div className='collectionHeader'>

                {/* Title and Collection ID */}
                <div className="collectionInformation">
                    <h1 className="title">{collection.name}</h1>
                    <h3>Collection #{collectionId}</h3>
                </div>
            </div>
        )
    }
}
