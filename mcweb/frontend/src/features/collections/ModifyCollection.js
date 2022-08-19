import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useDeleteCollectionMutation, useGetCollectionQuery, usePostCollectionMutation, useUpdateCollectionMutation } from '../../app/services/collectionsApi';

import SourceItem from '../sources/SourceItem';

//rtk api operations
import {
  useGetCollectionAndAssociationsQuery,
  useDeleteSourceCollectionAssociationMutation
} from '../../app/services/sourcesCollectionsApi';


//rtk actions to change state
import {
  setCollectionSourcesAssociations,
  dropSourceCollectionAssociation
} from '../sources_collections/sourcesCollectionsSlice';
import { setCollection } from './collectionsSlice';
import { setSources } from '../sources/sourceSlice';

export default function ModifyCollection() {
  const params = useParams()
  const collectionId = Number(params.collectionId); //get collection id from wildcard

  //send get query and associations
  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetCollectionAndAssociationsQuery(collectionId);

  const dispatch = useDispatch();
  //update redux store if there is data, or data changes
  useEffect(() => {
    if (data) {
      dispatch(setCollectionSourcesAssociations(data))
      dispatch(setSources(data))
      dispatch(setCollection(data))
    }
  }, [data]);

  //get collection
  const collection = useSelector(state => state.collections[collectionId]);

  //get sources
  const sources = useSelector(state => {
    return state.sourcesCollections.map(assoc => {
      return state.sources[assoc.source_id]
    })
  })

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // menu options
  const services = ["Online News", "Youtube"]



  // form state for text fields 
  const [formState, setFormState] = React.useState({
    id: 6, name: "", notes: "",
  });

  // create 
  const [createCollection, { setPost }] = usePostCollectionMutation();

  // update 
  const [updateCollection, { setUpdate }] = useUpdateCollectionMutation();

  // delete 
  const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();

  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

  if (!collection){
    return (<></>)
  }
  else {return (
    <div className='container'>
      <div className="collection-header">
        <h2 className="title">Modify this Collection</h2>
        <ul>
          {/* Name */}
          <li>
            <h5>Name</h5>
            <TextField
              fullWidth
              id="text"
              name="name"
              value={collection.name}
              onChange={handleChange}
            />
          </li>

          {/* Notes */}
          <li>
            <h5>Notes</h5>
            <TextField
              fullWidth
              id="outlined-multiline-static"
              name="notes"
              multiline
              rows={4}
              value={collection.notes}
              onChange={handleChange}
            />
          </li>

          {/* Update */}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              const updatedCollection = await updateCollection({
                id: formState.id,
                name: formState.name,
                notes: formState.notes
              }).unwrap();
              console.log(updatedCollection)
            }}
          >
            Update
          </Button>

          {/* Delete */}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              console.log(formState.id)
              const deletedCollection = await deleteCollection({
                id: formState.id
              }).unwrap()
              console.log(deletedCollection)
            }}
          >
            Delete
          </Button>

          {/* Create */}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              const createdCollection = await createCollection({
                name: formState.name,
                notes: formState.notes
              }).unwrap()
              // null == deleted 
              console.log(createdCollection)
            }}
          >
            Create
          </Button>

          <ul>
            {
              Object.values(sources).map(source => {
                return(
                  <div key={`source-item-modify-collection-${source.id}`} className="modify-collection-source-item-div">
                    <SourceItem  source={source} />
                    <button onClick={() => {
                      deleteSourceCollectionAssociation({
                        "source_id": source.id,
                        "collection_id": collectionId
                      })
                        .then(results => dispatch(dropSourceCollectionAssociation(results)))
                    }}>Remove</button>
                  </div>
                ) 
              })
            }
          </ul>
        </ul>
      </div>
    </div >
  )};
}