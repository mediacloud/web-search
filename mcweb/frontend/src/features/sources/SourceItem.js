import * as React from 'react';


export default function SourceItem(props) {
    const source = props.source;
    return (
        <li >
            <h6>{source.id}</h6>
            <h6>{source.label}</h6>
            <h6>{source.name}</h6>
        </li>
    )
}