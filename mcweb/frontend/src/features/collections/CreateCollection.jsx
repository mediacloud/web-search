import { TextField, Button } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useCreateCollectionMutation } from '../../app/services/collectionsApi';
import { platformDisplayName } from '../ui/uiUtil';

export default function CreateCollection() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '', notes: '', platform: ''
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [createCollection] = useCreateCollectionMutation();

  return (
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h1>
                Create a Collection
              </h1>
            </div>
          </div>
        </div>
      </div>

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

              <FormControl fullWidth>
                <InputLabel id="type-select-label">Platform</InputLabel>
                <Select
                  labelId="type-select-label"
                  id="type-select"
                  value={formState.platform}
                  name="platform"
                  label="Platform"
                  onChange={handleChange}
                >
                  <MenuItem value="online_news">{platformDisplayName('online_news')}</MenuItem>
                  <MenuItem value="reddit">{platformDisplayName('reddit')}</MenuItem>
                  <MenuItem value="twitter">{platformDisplayName('twitter')}</MenuItem>
                  <MenuItem value="youtube">{platformDisplayName('youtube')}</MenuItem>
                </Select>
              </FormControl>

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

            </div>

          </div>
        </div>
      </div>
    </>
  );
}
