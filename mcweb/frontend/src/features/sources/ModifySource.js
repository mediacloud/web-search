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

import { useGetCollectionQuery } from '../../app/services/collectionsApi';

//rtk actions to change state
import {
  setSourceCollectionsAssociations,
  setSourceCollectionAssociation,
  dropSourceCollectionAssociation
} from '../sources_collections/sourcesCollectionsSlice';
import { setSource } from './sourceSlice';
import { setCollections, setCollection } from '../collections/collectionsSlice';

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
    id: "", name: "", notes: "", homepage: "", label: "", service: ""
  });

  // create 
  const [post, { setPost }] = usePostSourceMutation();

  // update 
  const [updateSource, updateSourceResult] = useUpdateSourceMutation();

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

  useEffect(() => {
    if (data){
      const formData = {
        id: source.id, name: source.name, notes: source.notes, homepage: source.homepage, label: source.label
      }
      setFormState(formData)
    }
  }, [source])

  //patch for now, this should be fixed by a collections search feature, could also consider a debounce or throttle
  const [collectionId, setCollectionId] = useState("");

  const collectionData = useGetCollectionQuery(collectionId)

  const [createSourceCollectionAssociation, associationResult] = useCreateSourceCollectionAssociationMutation();


  if (!source){
    return <></>
  }
  else {
  return (
    <div className='modify-source-container'>
      <div className="collection-header">
        <h2 className="title">Modify this Source</h2>

        <ul>
          <h2>{source.id} - {source.label}</h2>

          {/* Name */}
          <li>
            <h5>Name</h5>
            <TextField
              fullWidth
              id="text"
              name="name"
              value={formState.name ? formState.name : "enter name"}
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
              value={formState.notes === null ? "" : formState.notes}
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
              value={formState.label ? formState.label : "enter or edit label"}
              onChange={handleChange}
            />
          </li>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              // console.log(formState)
              const updateCollection = await updateSource(formState).unwrap();
            }}
          >
            Update
          </Button>

          {/* <Button
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
          </Button> */}

        </ul>
      </div>
      <div>
        <h3>Collections</h3>

        <label> Add Collection to Source (enter the collection ID):
          <input type="text" value={collectionId} onChange={e => setCollectionId(Number(e.target.value))} />
        </label>

        <button onClick={() => {
          const assoc = { 'source_id': sourceId, 'collection_id': collectionId } //setup payload
          const collection = collectionData.data; //get the collection data from query
          dispatch(setCollection({ 'collections': collection }))
          createSourceCollectionAssociation(assoc)
            .then(() => dispatch(setSourceCollectionAssociation(assoc)))
          setCollectionId("")
        }}>Add Source</button>

        <ul className='collection-list'>
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