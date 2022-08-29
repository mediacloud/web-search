import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useDeleteCollectionMutation, useUpdateCollectionMutation } from '../../app/services/collectionsApi';
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
  //update redux store if there is data, or data changes, data is from useGetCollectionAndAssociationsQuery, with id from url
  useEffect(() => { // data comes in as (in this case, sourceModify is opposite): {collections:{id:1, name:newspapers}, sources:[{source1}, {source2}]}, can check redux state
    if (data) {
      dispatch(setCollectionSourcesAssociations(data)) //slice actions to update redux store
      dispatch(setSources(data))
      dispatch(setCollection(data))
    }
  }, [data]);

  //get collection
  const collection = useSelector(state => state.collections[collectionId]);

  //get sources
  const sources = useSelector(state => {
    return state.sourcesCollections.map(assoc => { //map the sources from sourcesCollections slice because that is where we have the associations kept
      return state.sources[assoc.source_id] //grab the source from state that matches the source_id, sourcesCollections state looks like {'source_id': 1, 'collection_id':1}
    }) //mapping first from the associations because if we remove or add an association we need it to update and rerender, also possibility there is a source in state that is not associated
  }) //ex. a recently deleted association would linger if we were only mapping the sources in our state (alternatively, can delete the source from state as well when deleting association (?))

  // form state for text fields 
  const [formState, setFormState] = useState({
    id: 0, name: "", notes: "",
  });

  //set form data to the collection specified in url
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

  //formState declaration
  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // show data 
  const [isShown, setIsShown] = useState(false)
  // menu options
  const services = ["Online News", "Youtube"]

  //patch for now, sources in the future will be uploadable only by csv
  const [sourceId, setSourceId] = useState("");
  const sourceData = useGetSourceQuery(sourceId)

  // rtk operations
  const [createSourceCollectionAssociation, associationResult] = useCreateSourceCollectionAssociationMutation();
  const [updateCollection, { setUpdate }] = useUpdateCollectionMutation();
  const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();
  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();

  if (!collection) {
    return (<></>)
  }
  else {
    return (
      <>
        {/* Header */}
        <div className='modifyHeader'>
          <h1>Modify this Collection</h1>

          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            onClick={async () => {
              setIsShown(!isShown)
            }}
          >
            Associations
          </Button>
        </div>

        {/* Collection Content */}
        <div className='modifyCollectionContent'>
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
          </ul>
        </div>

        {/* Assocations Content  */}
        {isShown &&
          <div className='collectionAssociations'>
            <div className='associationsHeader'>
              <h2> Add Source to Collection (enter the source ID): </h2>
              <input type="text" value={sourceId} onChange={e => setSourceId(Number(e.target.value))} />

              <button onClick={() => {
                const assoc = { 'source_id': sourceId, 'collection_id': collectionId } //get assoc data and package
                const source = sourceData.data; //data from getSource with entered id

                dispatch(setSource({ 'sources': source })) // put the source in the redux state

                createSourceCollectionAssociation(assoc) //create association
                  .then(() => dispatch(setSourceCollectionAssociation(assoc))) //if success update redux store

                setSourceId("") //reset id input field
              }}>
                Add Source
              </button>

            </div>


            <ul className='associationsContent'>
              {
                Object.values(sources).map(source => { // sources object {1: {id: 1, name: etc}}
                  return (
                    <div key={`source-item-modify-collection-${source.id}`} className='assocationsContentItem'>
                      <SourceItem source={source} />

                      <button onClick={() => {
                        deleteSourceCollectionAssociation({
                          "source_id": source.id,
                          "collection_id": collectionId
                        })
                          .then(results => dispatch(dropSourceCollectionAssociation(results))) //with results update redux store (only doing sourceCollections at this point)
                      }}>
                        Remove
                      </button>
                    </div>
                  )
                })}
            </ul>
          </div>
        }
      </>
    )
  }
}