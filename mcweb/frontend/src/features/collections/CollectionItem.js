import * as React from 'react';


export default function CollectionItem (props) {
    console.log(props)
    const collection = props.collection;
    console.log(collection)
    return (
        <li>
            <h5>{collection.id}</h5>
            <h5>{collection.name}</h5>
            <h5>{collection.notes}</h5>
        </li>
    )
}