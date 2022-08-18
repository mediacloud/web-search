import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useState } from 'react';
import { PublishedWithChanges } from '@mui/icons-material';

import { useDeleteCollectionMutation, useGetCollectionQuery, usePostCollectionMutation, useUpdateCollectionMutation } from '../../app/services/collectionsApi';

export default function ModifyCollection() {

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // menu options
  const services = ["Online News", "Youtube"]



  // form state for text fields 
  const [formState, setFormState] = React.useState({
    id: 6, name: "", notes: "",
  });


  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error
  } = useGetCollectionQuery(formState.id)

  // create 
  const [createCollection, { setPost }] = usePostCollectionMutation();

  // update 
  const [updateCollection, { setUpdate }] = useUpdateCollectionMutation();

  // delete 
  const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();



  return (
    <div className='container'>
      <div className="collection-header">
        <h2 className="title">Modify this Collection</h2>

        <ul>
          <TextField
            id="text"
            label="ID"
            name="id"
            defaultValue={formState.id}
            onChange={handleChange}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              setFormState({
                name: data.name,
                notes: data.notes,
                id: data.id

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
        </ul>
      </div>
    </div >
  );
}