import * as React from 'react';
import { useGetSourceAndAssociationsQuery, useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import CollectionItem from './CollectionItem';

export default function CollectionList(props) {
    const { sourceId, edit } = props
    const {
        data,
        isLoading
    } = useGetSourceAndAssociationsQuery(sourceId);

    const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();


    if (isLoading){
        return (<h1>Loading...</h1>)
    } 
    else if (edit){
        return (
            <div>
                <h4>This Source is in {data['collections'].length} Collections</h4>
                {data['collections'].map(collection => (
                    <div key={collection.id}>
                        <CollectionItem  collection={collection} />
                        <button onClick={() => {
                            deleteSourceCollectionAssociation({
                                "source_id": sourceId,
                                "collection_id": collection.id
                            })
                        }}>Remove</button>
                    </div>
                ))}
            </div>
        )
    }
    else {
        return (
            <div>
                <h4>This Source is in {data['collections'].length} Collections</h4>
                {data['collections'].map(collection => (
                    <CollectionItem key={collection.id} collection={collection} />
                ))}
            </div>
        )
    }
}