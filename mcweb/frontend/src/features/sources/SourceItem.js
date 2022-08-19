import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { dropSourceCollectionAssociation } from '../sources_collections/sourcesCollectionsSlice';

export default function SourceItem(props) {
    const source = props.source;

    const params = useParams();
    const collectionId = Number(params.collectionId);

    const dispatch = useDispatch();

    const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

    return (
        <li >
            <Link className="source-link" to={`/sources/${source.id}`}>
                <h6>{source.id}</h6>
                <h6>{source.label}</h6>
                <h6>{source.name}</h6>
            </Link>
            <button onClick={() => {
                deleteSourceCollectionAssociation({
                    "source_id": source.id,
                    "collection_id": collectionId
                })
                    .then(results => dispatch(dropSourceCollectionAssociation(results)))
            }}>Remove</button>
        </li>
    )
}