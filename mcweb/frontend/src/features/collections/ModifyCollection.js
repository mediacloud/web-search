import * as React from 'react';
import { TextField } from '@mui/material';
import { useState } from 'react';

export default function ModifyCollection() {

  const [formState, setFormState] = React.useState({
    name: '', notes: '', service: '', static: false, public: false
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))


  const name = "U.S. Top Digital Native Sources"
  const notes = "Collection #186572515 - Public - Dynamic"
  const service = "Online News"

  return (
    <div className='container'>
      <div className="collection-header">
        <h2 className="title">Modify this Collection</h2>

        <ul>
          <li>
            <h5>Name</h5>
            <TextField
              id="text"
              label="Name"
              name="name"
              onChange={handleChange}
            />
          </li>

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
        </ul>
      </div>
    </div >
  );
}