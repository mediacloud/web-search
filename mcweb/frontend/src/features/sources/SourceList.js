import * as React from 'react';
import { useGetCollectionAndAssociationsQuery } from '../../app/services/sourcesCollectionsApi';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import SourceItem  from './SourceItem';

export default function SourceList(props) {
    const { collectionId, edit } = props;

    const { 
        data,
        isLoading 
    } = useGetCollectionAndAssociationsQuery(collectionId);

    const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();


    if(isLoading){ 
        return (<h1>Loading...</h1>)
    } 
    else if (edit){
        return (
            <div>
                <h4>This Collection has {data['sources'].length} Sources</h4>
                {data['sources'].map(source => (
                    <div key={`edit-${source.id}`}>
                        <SourceItem  source={source} />
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
            <div>
                <h4>This Collection has {data['sources'].length} Sources</h4>
                {data['sources'].map(source => (
                    <SourceItem key={`source-${source.id}`} source={source} />
                ))}
            </div>
        )
    }
}