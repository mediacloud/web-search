import * as React from 'react';
import { Link } from 'react-router-dom';

export default function SourceItem(props) {
    const source = props.source
    return (
        <li>
            <Link className="source-collection-item" to={`/sources/${source.id}`}>
                <h5 className='source-item-id'>{source.id}</h5>
                <h5 className='source-item-label'>{source.label}</h5>
                <h5>{source.name}</h5>
            </Link>
        </li>
    )
}