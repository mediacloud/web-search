import * as React from 'react';
import { Link } from 'react-router-dom';

export default function SourceItem(props) {
    const source = props.source
    return (
        <li>
            <Link className="collectionItem" to={`/sources/${source.id}`}>
                <h6>{source.id}</h6>
                <h6>{source.label}</h6>
                <h6>{source.name}</h6>
            </Link>
        </li>
    )
}