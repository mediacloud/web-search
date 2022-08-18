import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useState } from 'react';

import { useDeleteCollectionMutation, useGetCollectionQuery, usePostCollectionMutation, useUpdateCollectionMutation } from '../../app/services/collectionsApi';

export default function ModifyCollection() {

<<<<<<< HEAD
  // menu options
  const services = ["Online News", "Youtube"]

  // original values 
  const name = "U.S. Top Digital Native Sources"
  const notes = "Collection #186572515 - Public - Dynamic"
  const service = "Online News"

  // form state for text fields 
  const [formState, setFormState] = useState({
    name: name, notes: notes, service: service,
  });


  // represents the static and public check boxes
  const [checkState, setCheckState] = useState({
    pub: true,
    stat: false,
  });

  const handleCheck = (event) => {
    setCheckState({
      ...checkState,
      [event.target.name]: event.target.checked,
    });
  };

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))
=======
  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // menu options
  const services = ["Online News", "Youtube"]



  // form state for text fields 
  const [formState, setFormState] = React.useState({
    id: 118, name: "", notes: "",
  });


  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error
  } = useGetCollectionQuery(formState.id)

  // create 
  const [post, { setPost }] = usePostCollectionMutation();

  // update 
  const [update, { setUpdate }] = useUpdateCollectionMutation();

  // delete 
  const [remove, { setRemove }] = useDeleteCollectionMutation();
>>>>>>> c696c555aac9a1c8a2747541e0a70a051aaf0393

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

<<<<<<< HEAD
          {/* Service */}
          <li>
            <h5>Service</h5>
            <Box
              component="form"
              sx={{
                '& .MuiTextField-root': { m: 1, width: '25ch' },
              }}
              noValidate
              autoComplete="off"
            >

              <TextField
                select
                names="service"
                label="Select"
                onChange={handleChange}
                defaultValue={service}
              >
                {services.map((service) => (
                  <MenuItem key={service} value={service}>
                    {service}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </li>

          {/* Static Button */}
          <li>
            <h5>Static</h5>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkState.stat}
                  onChange={handleCheck}
                  name="stat"
                />
              }
            />

          </li>

          {/* Public Button */}
          <li>
            <h5>Public</h5>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkState.pub}
                  onChange={handleCheck}
                  name="pub"
                />
              }
            />
          </li>

=======
>>>>>>> c696c555aac9a1c8a2747541e0a70a051aaf0393
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
<<<<<<< HEAD
              console.log("Name: " + formState.name)
              console.log("Notes: " + formState.notes)
              console.log("Service: " + formState.service)
              console.log("Static: " + checkState.stat)
              console.log("Public: " + checkState.pub)
=======
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
                name: formState.name,
                notes: formState.notes
              }).unwrap()
              // null == deleted 
              console.log(createCollection)
>>>>>>> c696c555aac9a1c8a2747541e0a70a051aaf0393
            }}
          >
            Create
          </Button>
        </ul>
      </div>
    </div >
  );
}