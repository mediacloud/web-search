import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { dropSourceCollectionAssociation } from '../sources_collections/sourcesCollectionsSlice';

export default function CollectionItem (props) {
    const collection = props.collection;
    const params = useParams();
    const sourceId = Number(params.sourceId);

    const dispatch = useDispatch();

    const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();
    return (
        <li>
            <Link to={`/collections/${collection.id}`}>
                <h5>{collection.id}</h5>
                <h5>{collection.name}</h5>
                <h5>{collection.notes}</h5>
            </Link>
            <button onClick={()=>{
                deleteSourceCollectionAssociation({
                    "source_id": sourceId,
                    "collection_id": collection.id
                })
                    .then(results => dispatch(dropSourceCollectionAssociation(results)))
            }}>Remove</button>
        </li>
    )
}