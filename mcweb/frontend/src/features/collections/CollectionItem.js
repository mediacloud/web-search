import * as React from 'react';
import { Link } from 'react-router-dom';

export default function CollectionItem (props) {
    const collection = props.collection; 
    return (
        <li>
            <Link className="source-collection-item" to={`/collections/${collection.id}`}>
                <h5>{collection.id}</h5>
                <h5>{collection.name}</h5>
                <h5>{collection.notes}</h5>
            </Link>
        </li>
    );
}