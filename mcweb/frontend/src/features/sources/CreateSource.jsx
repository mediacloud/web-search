import { TextField, Button } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useCreateSourceMutation } from '../../app/services/sourceApi';
import { platformDisplayName, mediaTypeDisplayName } from '../ui/uiUtil';
import Header from '../ui/Header';

export default function CreateCollection() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '', notes: '', homepage: '', label: '', platform: '', url_search_string: '', media_type: '', collections: [],
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [createSource] = useCreateSourceMutation();

  return (
    <>
      <Header>
        <h1>
          Create a Source
        </h1>
      </Header>

      <div className="container">
        <div className="row">
          <div className="col-12">

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
            <br />
            <br />

            <TextField
              fullWidth
              name="name"
              label="name"
              helperText="This is the unique identified for this source within our system. Don't change this unless you know what you're doing. For news sources this should be the unique domain name."
              value={formState.name}
              onChange={handleChange}
            />
            <br />
            <br />
            <TextField
              fullWidth
              name="notes"
              label="Notes"
              multiline
              rows={4}
              value={formState.notes}
              onChange={handleChange}
              helperText="These will be shown publicly on the source page in our system."
            />
            <br />
            <br />
            <TextField
              fullWidth
              name="homepage"
              label="Homepage"
              value={formState.homepage}
              onChange={handleChange}
            />
            <br />
            <br />
            <TextField
              fullWidth
              name="label"
              label="Label"
              value={formState.label}
              onChange={handleChange}
              helperText="The human-readable name shown to people for this source. Leave empty to have the domain be the name."
            />
            <br />
            <br />
            <FormControl fullWidth>
              <InputLabel id="media-select-label">Media Type</InputLabel>
              <Select
                labelId="media-select-label"
                id="media-select"
                value={formState.media_type}
                name="media_type"
                label="Media Type"
                onChange={handleChange}
              >
                <MenuItem value="audio_broadcast">{mediaTypeDisplayName('audio_broadcast')}</MenuItem>
                <MenuItem value="digital_native">{mediaTypeDisplayName('digital_native')}</MenuItem>
                <MenuItem value="print_native">{mediaTypeDisplayName('print_native')}</MenuItem>
                <MenuItem value="video_broadcast">{mediaTypeDisplayName('video_broadcast')}</MenuItem>
                <MenuItem value="other">{mediaTypeDisplayName('other')}</MenuItem>
              </Select>
            </FormControl>
            <br />
            <br />
            <TextField
              fullWidth
              name="url_search_string"
              label="URL Search String"
              value={formState.url_search_string}
              onChange={handleChange}
              helperText="For a very small number of news sources, we want to search within a subdomain (such as news.bbc.co.uk/nigeria). If this is one of those exceptions, enter a wild-carded search string here, such as '*news.bbc.co.uk/nigeria/*'."
            />
            <br />
            <br />

            <Button
              variant="contained"
              onClick={async () => {
                const newSource = await createSource(formState).unwrap();
                navigate(`/sources/${newSource.id}`);
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
