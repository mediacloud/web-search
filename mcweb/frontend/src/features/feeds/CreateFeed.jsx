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
    name: '', url: '', admin_rss_enabled: true, source: sourceId,
  });

  const handleChange = ({ target: { name, value } }) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheck = () => {
    setFormState((prev) => ({ ...prev, admin_rss_enabled: !prev.admin_rss_enabled }));
  };

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
            helperText="Feed url to be scraped"
          />
          <br />
          <br />
          <FormControl>
            <FormControlLabel
              control={<Checkbox onChange={handleCheck} checked={formState.admin_rss_enabled} />}
              label="Admin enabled?"
            />
          </FormControl>
          <br />
          <br />
          <Button
            variant="contained"
            onClick={async () => {
              await createFeed({
                name: formState.name.trim(),
                url: formState.url.trim(),
                admin_rss_enabled: formState.admin_rss_enabled,
                source: formState.source,
              }).unwrap();
              navigate(`/sources/${sourceId}/feeds`);
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
