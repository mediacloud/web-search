import * as React from 'react';
import { TextField, MenuItem, Box, FormControlLabel, Button, Checkbox } from '@mui/material';
import { useState } from 'react';
import { PublishedWithChanges } from '@mui/icons-material';

import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function ModifyCollection() {

  // I'd really like to refactor this to the formState, however I keep getting errors 
  const [stat, setStatic] = React.useState(false)
  const [pub, setPublic] = React.useState(false)

  const handleStatic = (event) => {
    setStatic(event.target.checked);
  };
  const handlePublic = (event) => {
    setPublic(event.target.checked);
  };


  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // menu options
  const services = ["Online News", "Youtube"]

  // original values 
  const name = ""
  const notes = ""
  const service = ""

  // form state for text fields 
  const [formState, setFormState] = React.useState({
    name: name, notes: notes, service: service, id: 1,
  });


  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error
  } = useGetCollectionQuery(formState.id)


  


  





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

              console.log(data)

             console.log(data.notes)
             console.log(data.name)

           

            


            }}
          >
            ID
          </Button>

          {/* Name */}
          <li>
            <h5>Name</h5>
            <TextField
              id="text"
              label="Name"
              name="name"
              defaultValue={name}
              onChange={handleChange}
            />
          </li>

          {/* Notes */}
          <li>
            <h5>Notes</h5>
            <TextField
              id="outlined-multiline-static"
              label="Notes"
              name="notes"
              multiline
              rows={4}
              defaultValue={notes}
              onChange={handleChange}
            />
          </li>


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
                  checked={formState.stat}
                  onChange={handleStatic}
                  name="static"
                  defaultValue={formState.stat}
                  inputProps={{ 'aria-label': 'controlled' }}
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
                  checked={pub}
                  onChange={handlePublic}
                  name="public"
                  defaultValue={pub}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              }
            />
          </li>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              console.log("Name: " + formState.name)
              console.log("Notes: " + formState.notes)
              console.log("Service: " + formState.service)
              console.log("Static: " + stat)
              console.log("Public: " + pub)


            }}
          >
            Save
          </Button>
        </ul>
      </div>
    </div >
  );
}