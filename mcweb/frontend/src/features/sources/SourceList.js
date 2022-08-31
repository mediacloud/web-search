import * as React from 'react';
import { useGetCollectionAndAssociationsQuery } from '../../app/services/sourcesCollectionsApi';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import SourceItem from './SourceItem';

export default function SourceList(props) {
    const { collectionId, edit } = props;
    const {
        data,
        isLoading
    } = useGetCollectionAndAssociationsQuery(collectionId);

    const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

    // if loading
    if (isLoading) {
        return (<h1>Loading...</h1>)
    }
    // if edit 
    else if (edit) {
        return (
            <div className="collectionAssociations">
                {/* Header */}
                <h2>This Collection has {data['sources'].length} Sources</h2>
                {data.sources.map(source => (
                    <div className="collectionItem" key={`edit-${source.id}`}>

                        {/* Source */}
                        <SourceItem source={source} />

                        {/* Remove */}
                        <button onClick={() => {
                            deleteSourceCollectionAssociation({
                                "source_id": source.id,
                                "collection_id": collectionId
                            })
                        }}>
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        )
    }
    else {
        return (
            <div className="collectionAssociations">

                {/* Header */}
                <h2>Associated with {data['sources'].length} Sources</h2>

                {data['sources'].map(source => (
                    <div className="collectionItem" key={`edit-${source.id}`}>

                        {/* Source */}
                        < SourceItem key={`source-${source.id}`} source={source} />
                    </div>
                ))}
            </div>
        )
    }
}