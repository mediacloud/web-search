import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useCreateFeedMutation } from '../../app/services/feedsApi';

export default function CreateFeed() {
  const navigate = useNavigate();
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const [formState, setFormState] = useState({
    name: '', url: '', adminEnabled: true, source: sourceId,
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const handleCheck = () => (
    setFormState((prev) => ({ ...prev, adminEnabled: !prev.admin_rss_enabled }))
  );

  const [createFeed] = useCreateFeedMutation();

  return (
    <div className="container">
      <div className="row">
        <h1 className="col-12">
          Create a Feed
        </h1>
        <div className="col-12">

          <TextField
            fullWidth
            name="name"
            label="name"
            helperText="Human readable name"
            value={formState.name}
            onChange={handleChange}
          />
          <br />
          <br />
          <TextField
            fullWidth
            name="url"
            label="URL"
            value={formState.url}
            onChange={handleChange}
            helperText="RSS feed url to be scraped"
          />
          <br />
          <br />
          <FormControl>
            <FormControlLabel
              control={<Checkbox onChange={handleCheck} checked={formState.adminEnabled} />}
              label="Admin enabled?"
            />
          </FormControl>
          <br />
          <br />
          <Button
            variant="contained"
            onClick={async () => {
              const newFeed = await createFeed(formState).unwrap();
              navigate(`/feeds/${newFeed.id}`);
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
