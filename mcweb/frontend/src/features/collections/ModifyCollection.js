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
  useDeleteSourceCollectionAssociationMutation,
  useCreateSourceCollectionAssociationMutation
} from '../../app/services/sourcesCollectionsApi';

import { useGetSourceQuery } from '../../app/services/sourceApi';



//rtk actions to change state
import {
  setCollectionSourcesAssociations,
  dropSourceCollectionAssociation,
  setSourceCollectionAssociation
} from '../sources_collections/sourcesCollectionsSlice';
import { setCollection } from './collectionsSlice';
import { setSources, setSource } from '../sources/sourceSlice';

export default function ModifyCollection() {
  const params = useParams()
  const collectionId = Number(params.collectionId); //get collection id from wildcard

  //send get query and associations
  const { data } = useGetCollectionAndAssociationsQuery(collectionId);

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

  // form state for text fields 
  const [formState, setFormState] = useState({
    id: 0, name: "", notes: "",
  });

  useEffect(() => {
    if (data) {
      const formData = {
        id: collection.id,
        name: collection.name,
        notes: collection.notes
      }
      setFormState(formData)
    }
  }, [collection])

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // menu options
  const services = ["Online News", "Youtube"]


//patch for now, sources in the future will be uploadable only by csv
  const [sourceId, setSourceId] = useState("");
  const sourceData = useGetSourceQuery(sourceId)

  // create 
  const [createCollection, { setPost }] = usePostCollectionMutation();

  const [createSourceCollectionAssociation, associationResult] = useCreateSourceCollectionAssociationMutation();

  // update 
  const [updateCollection, { setUpdate }] = useUpdateCollectionMutation();

  // delete 
  const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();

  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

  if (!collection){
    return (<></>)
  }
  else {return (
    <div className='modify-collection-container'>
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
              value={formState.name}
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
            }}
          >
            Update
          </Button>

          {/* Delete */}
          {/* <Button
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
          </Button> */}


          <label> Add Source to Collection (enter the source ID): 
            <input type="text" value={sourceId} onChange={e => setSourceId(Number(e.target.value)) } />
          </label>

          <button onClick={() => {
            const assoc = {'source_id': sourceId, 'collection_id': collectionId}
            const source = sourceData.data;
            dispatch(setSource({'sources': source}))
            createSourceCollectionAssociation(assoc)
              .then(() => dispatch(setSourceCollectionAssociation(assoc)))
            setSourceId("")
          }}>Add Source</button>

          <h5>Sources</h5>
          <ul className='modify-collection-source-list'>
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