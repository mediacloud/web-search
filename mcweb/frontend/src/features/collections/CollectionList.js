import * as React from 'react';
import { useGetSourceAndAssociationsQuery } from '../../app/services/sourcesCollectionsApi';
import CollectionItem from './CollectionItem';

export default function CollectionList(props) {
    const { sourceId } = props
    const {
        data,
        isLoading
    } = useGetSourceAndAssociationsQuery(sourceId);

    if (isLoading) return (<h1>Loading...</h1>)

    else {
        return (
            <div>
                <h4>This Source has {data['collections'].length} Sources</h4>
                {data['collections'].map(collection => (
                    <CollectionItem key={collection.id} collection={collection} />
                ))}
            </div>
        )
    }
}