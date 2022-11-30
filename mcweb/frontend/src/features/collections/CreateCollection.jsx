import * as React from 'react';
import { TextField, Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollectionMutation } from '../../app/services/collectionsApi';

export default function CreateCollection() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '', notes: '',
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [createCollection] = useCreateCollectionMutation();

  return (
    <>
      {/* Header */}
      <div className="modifyHeader">
        <h1>Create A Collection</h1>
      </div>

      {/* Collection Content */}
      <div className="modifyCollectionContent">
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

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              const newCollection = await createCollection({
                name: formState.name,
                notes: formState.notes,
              }).unwrap()
                .then((collection) => navigate(`/collections/${collection.id}`));
            }}
          >
            Create
          </Button>
        </ul>
      </div>
    </>
  );
}
