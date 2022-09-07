import * as React from 'react';
import { useGetSourceAndAssociationsQuery, useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import CollectionItem from './CollectionItem';

import Papa from 'papaparse'

import { useState } from 'react';

export default function CollectionList(props) {

  const [collection, setCollection] = useState();

  const { sourceId, edit } = props
  const {
    data,
    isLoading: loading
  } = useGetSourceAndAssociationsQuery(sourceId);



  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

  if (loading) {
    return (<h1>Loading...</h1>)
  }
  else if (edit) {



    return (



      <div className='collectionAssociations'>
        {/* Header */}
        <h2 className='associationsHeader'>This Source is in {data['collections'].length} Collections</h2>

        <button onClick={() => {
          const realData = data.collections.map((collection) => [
            collection.id,
            collection.name,
            collection.notes,
          ])

          console.log(realData)
          const fields = ['ID', 'Title', 'Description']

          const csv = Papa.unparse({
            fields: fields,
            data: realData
          })

          const blob = new Blob([csv])

          const a = document.createElement('a');

          a.href = URL.createObjectURL(blob, { type: 'text/plain' });

          a.download = 'CSV Export File';

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

        }}>
          Download
        </button>

        {
          data.collections.map(collection => (
            <div className='collectionItem' key={`edit-${collection.id}`} >

              {/* Collection Item */}
              <CollectionItem collection={collection} />



              {/* Remove */}
              <button onClick={() => {
                deleteSourceCollectionAssociation({
                  "source_id": sourceId,
                  "collection_id": collection.id
                })
              }}>
                Remove
              </button>
            </div>
          ))
        }
      </div >
    )
  }
  else {
    return (
      <div className='collectionAssociations'>

        {/* Header */}
        <h2> Associated with {data['collections'].length} Collections</h2>
        {data.collections.map(collection => (
          <div className="collectionItem" key={`${collection.id}`}>

            {/* Collection */}
            <CollectionItem key={collection.id} collection={collection} />
          </div>
        ))}
      </div>
    )
  }
}