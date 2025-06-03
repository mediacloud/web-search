import { TextField, Button } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCollectionMutation } from '../../app/services/collectionsApi';
import Header from '../ui/Header';

export default function CreateCollection() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '', notes: '', platform: 'online_news', managed: false,
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [createCollection] = useCreateCollectionMutation();

  return (
    <>
      <Header>
        <h1>
          Create a Collection
        </h1>
      </Header>

      <div className="container">
        <div className="row">
          <div className="col-12">

            {/* Collection Content */}
            <div className="modifyCollectionContent">

              <TextField
                fullWidth
                id="text"
                name="name"
                label="Name"
                value={formState.name}
                onChange={handleChange}
              />

              <br />
              <br />

              <TextField
                fullWidth
                id="outlined-multiline-static"
                name="notes"
                label="Notes"
                multiline
                rows={4}
                value={formState.notes}
                onChange={handleChange}
              />

              <br />
              <br />

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={async () => {
                  await createCollection({
                    name: formState.name.trim(),
                    notes: formState.notes.trim(),
                    platform: formState.platform,
                    managed: formState.managed,
                  }).unwrap()
                    .then((collection) => navigate(`/collections/${collection.id}`));
                }}
              >
                Create
              </Button>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}
