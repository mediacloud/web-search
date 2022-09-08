import * as React from 'react';
import { useGetSourceAndAssociationsQuery, useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import CollectionItem from './CollectionItem';

import { useCSVDownloader } from 'react-papaparse';

import { useState } from 'react';

export default function CollectionList(props) {

  const [collection, setCollection] = useState()

  const { CSVDownloader, Type } = useCSVDownloader();

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
    
    const id_list = data.collections.map((collection) => collection.id + "\n")
    const name_list = data.collections.map((collection) => collection.name + "\n")
    const notes_list = data.collections.map((collection) => collection.notes + "\n")

    return (
      <div className='collectionAssociations'>

        <CSVDownloader
          type={Type.Button}
          filename={"CollectionList"}
          bom={true}
          config={
            {
              delimiter: "\n",
              newLine: "\n"
            }
          }
          data={
            [
              {
                "id": id_list,
                "name": name_list,
                "notes": notes_list,
              }, 
              
            ]
          }
        >
          Download
        </CSVDownloader>
        {/* Header */}
        <h2 className='associationsHeader'>This Source is in {data['collections'].length} Collections</h2>

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