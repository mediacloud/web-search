import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PublishedWithChanges } from '@mui/icons-material';

import CollectionItem from '../collections/CollectionItem';

//rtk api operations...corresponding with API calls to the backend
import {
  useCreateSourceCollectionAssociationMutation,
  useGetSourceAndAssociationsQuery,
  useDeleteSourceCollectionAssociationMutation
} from '../../app/services/sourcesCollectionsApi';

//rtk actions to change state
import {
  setSourceCollectionsAssociations,
  setSourceCollectionAssociation,
  dropSourceCollectionAssociation
} from '../sources_collections/sourcesCollectionsSlice';
import { setSource } from './sourceSlice';
import { setCollections } from '../collections/collectionsSlice';

import {
  useGetSourceQuery,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  usePostSourceMutation
}
  from '../../app/services/sourceApi';

export default function ModifySource() {

  const params = useParams();
  const sourceId = params.sourceId;

  const source = useSelector(state => state.sources[sourceId]);
  const collections = useSelector(state => {
    return state.sourcesCollections.map(assoc => {
      return state.collections[assoc.collection_id]
    })
  })

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // menu options
  const services = ["Online News", "Youtube"]
  
  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();


  // form state for text fields 
  const [formState, setFormState] = React.useState({
    id: 571, name: "", notes: "", homepage: "", label: "", service: ""
  });

  // const {
  //   data,
  //   isLoading,
  //   isSuccess,
  //   isError,
  //   error
  // } = useGetSourceQuery(formState.id)

  // create 
  const [post, { setPost }] = usePostSourceMutation();

  // update 
  const [update, { setUpdate }] = useUpdateSourceMutation();

  // delete 
  const [remove, { setRemove }] = useDeleteSourceMutation();

  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetSourceAndAssociationsQuery(sourceId);

  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      dispatch(setSourceCollectionsAssociations(data))
      dispatch(setSource(data))
      dispatch(setCollections(data))
    }
  }, [data]);

  if (!source){
    return <></>
  }
  else {
  return (
    <div className='container'>
      <div className="collection-header">
        <h2 className="title">Modify this Source</h2>

        <ul>
          <h2>{source.id}</h2>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              console.log(data)
              setFormState({
                id: data.id,
                name: data.name,
                homepage: data.homepage,
                label: data.label,
              })
            }}
          >
            Get
          </Button>

          {/* Name */}
          <li>
            <h5>Name</h5>
            <TextField
              fullWidth
              id="text"
              name="name"
              value={source.name}
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
              value={formState.notes}
              onChange={handleChange}
            />
          </li>

          {/* Homepage */}
          <li>
            <h5>Homepage</h5>
            <TextField
              fullWidth
              id="text"
              name="homepage"
              value={formState.homepage}
              onChange={handleChange}
            />
          </li>

          {/* Label */}
          <li>
            <h5>Label</h5>
            <TextField
              fullWidth
              id="text"
              name="label"
              onChange={handleChange}
            />
          </li>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              const updateCollection = await update({
                ...formState
              }).unwrap();
              console.log(updateCollection)
            }}
          >
            Update
          </Button>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              console.log(formState.id)
              const deleteCollection = await remove({
                id: formState.id
              }).unwrap()
              // deleted == null
              console.log(deleteCollection)
            }}
          >
            Delete
          </Button>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              const createCollection = await post({
                formState

              }).unwrap()
              console.log(createCollection)
            }}
          >
            Create
          </Button>
        </ul>
      </div>
      <div>
        <h3>Collections</h3>

        <ul>
          {Object.values(collections).map(collection => {
            return (
              <div className='collection-item-modify-source-div' key={`collection-item-modify-source-${collection.id}`}>
                <CollectionItem collection={collection} />
                <button onClick={() => {
                  deleteSourceCollectionAssociation({
                    "source_id": sourceId,
                    "collection_id": collection.id
                  })
                    .then(results => dispatch(dropSourceCollectionAssociation(results))) //delete the association .then update the redux store
                }}>Remove</button>
              </div>
            )
          })}
        </ul>

      </div>
    </div >
  )};
}