import * as React from 'react';
import { useGetCollectionAndAssociationsQuery } from '../../app/services/sourcesCollectionsApi';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import SourceItem from './SourceItem';

import { useCSVDownloader } from 'react-papaparse';


export default function SourceList(props) {
  const { collectionId, edit } = props;
  const { CSVDownloader, Type } = useCSVDownloader();

  const {
    data,
    isLoading
  } = useGetCollectionAndAssociationsQuery(collectionId);

  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

  // if loading
  if (isLoading) {
    return (<h1>Loading...</h1>)
  }
  // if edit 
  else if (edit) {
    const id_list = data.sources.map((collection) => collection.id + "\n")
    const name_list = data.sources.map((collection) => collection.name + "\n")
    const notes_list = data.sources.map((collection) => collection.notes + "\n")

    return (
      <div className="collectionAssociations">
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
        <h2>This Collection has {data['sources'].length} Sources</h2>
        {data.sources.map(source => (
          <div className="collectionItem" key={`edit-${source.id}`}>

            {/* Source */}
            <SourceItem source={source} />

            {/* Remove */}
            <button onClick={() => {
              deleteSourceCollectionAssociation({
                "source_id": source.id,
                "collection_id": collectionId
              })
            }}>
              Remove
            </button>
          </div>
        ))}
      </div>
    )
  }
  else {
    return (
      <div className="collectionAssociations">

        {/* Header */}
        <h2>Associated with {data['sources'].length} Sources</h2>
        {data['sources'].map(source => (
          <div className="collectionItem" key={`${source.id}`}>

            {/* Source */}
            < SourceItem key={`source-${source.id}`} source={source} />
          </div>
        ))}
      </div>
    )
  }
}