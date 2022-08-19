import * as React from 'react';
import { Link } from 'react-router-dom';

export default function CollectionItem (props) {
    const collection = props.collection; //get collection from props
    return (
        <li className="collection-item-li">
            <Link to={`/collections/${collection.id}`}>
                <h5>{collection.id}</h5>
                <h5>{collection.name}</h5>
                <h5>{collection.notes}</h5>
            </Link>

        </li>
    )
}