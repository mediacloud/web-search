import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDeleteCollectionMutation, useUpdateCollectionMutation } from '../../app/services/collectionsApi';
import SourceList from '../sources/SourceList';

//rtk api operations
import { useCreateSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function ModifyCollection() {
  const params = useParams()
  const collectionId = Number(params.collectionId); //get collection id from wildcard

  const { data, isLoading } = useGetCollectionQuery(collectionId);

  // form state for text fields 
  const [formState, setFormState] = useState({
    id: 0, name: "", notes: "",
  });

  //formState declaration
  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // show data 
  const [isShown, setIsShown] = useState(true)
  // menu options
  const services = ["Online News", "Youtube"]

  //patch for now, sources in the future will be uploadable only by csv
  const [sourceId, setSourceId] = useState("");
  const sourceData = useGetSourceQuery(sourceId)

  // rtk operations
  const [createSourceCollectionAssociation, associationResult] = useCreateSourceCollectionAssociationMutation();
  const [updateCollection, { setUpdate }] = useUpdateCollectionMutation();
  const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();

  //set form data to the collection specified in url
  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id,
        name: data.name,
        notes: data.notes ? data.notes : ""
      }
      setFormState(formData)
    }
  }, [data])

  if (isLoading) {
    return (<h1>Loading...</h1>)
  }
  else {
    return (
      <>
        <div className='modifyHeader'>
          <h1>Modify {data.id}: {data.name} Collection</h1>
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
                  const assoc = { 'source_id': sourceId, 'collection_id': collectionId } 
                  const source = sourceData.data; 
                  createSourceCollectionAssociation(assoc) 
                  setSourceId("") 
                }}>
                  Add Source
                </button>

              </div>

            <SourceList collectionId={collectionId} edit={true} />
            
          </div>
        }
      </>
    )
  }
}