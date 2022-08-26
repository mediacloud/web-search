import * as React from 'react';
import { useGetCollectionAndAssociationsQuery } from '../../app/services/sourcesCollectionsApi';
import SourceItem  from './SourceItem';

export default function SourceList(props) {
    const { collectionId } = props
    const { 
        data,
        isLoading 
    } = useGetCollectionAndAssociationsQuery(collectionId);

    if (isLoading) return (<h1>Loading...</h1>)

    else {
        return (
            <div>
                {data['sources'].map(source => (
                    <SourceItem key={source.id} source={source} />
                ))}
            </div>
        )
    }
}