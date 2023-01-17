import * as React from 'react';
import { TextField, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import InputLabel from '@mui/material/InputLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useSnackbar } from 'notistack';
import Select from '@mui/material/Select';
import { useUpdateCollectionMutation, useGetCollectionQuery } from '../../app/services/collectionsApi';
import SourceList from '../sources/SourceList';
import UploadSources from '../sources/UploadSources';
import { platformDisplayName } from '../ui/uiUtil';

export default function ModifyCollection() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const collectionId = Number(params.collectionId); // get collection id from wildcard

  const { data, isLoading } = useGetCollectionQuery(collectionId);

  // form state for text fields
  const [formState, setFormState] = useState({
    id: 0, name: '', notes: '', platform: 'online_news', public: true, featured: false,
  });

  // formState declaration
  const handleChange = ({ target }) => {
    const newValue = (target.type === 'checkbox') ? target.checked : target.value;
    setFormState((prev) => ({ ...prev, [target.name]: newValue }));
  };

  // rtk operations
  const [updateCollection] = useUpdateCollectionMutation();
  // const [deleteCollection, { setRemove }] = useDeleteCollectionMutation();

  // set form data to the collection specified in url
  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id,
        name: data.name,
        notes: data.notes ? data.notes : '',
        platform: data.platform,
        public: data.public,
        featured: data.featured,
      };
      setFormState(formData);
    }
  }, [data]);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div className="container">

      <div className="row">
        <div className="col-12">
          <h2>Edit Collection</h2>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <br />
          <TextField
            label="Name"
            fullWidth
            id="text"
            name="name"
            value={formState.name}
            onChange={handleChange}
          />
          <br />
          <br />
          <TextField
            fullWidth
            label="Notes"
            id="outlined-multiline-static"
            name="notes"
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
          <br />
          <br />
          <FormGroup>
            <FormControlLabel
              control={(
                <Checkbox
                  name="public"
                  checked={formState.public}
                  onChange={handleChange}
                />
)}
              label="Public?"
            />
            <FormControlLabel
              control={(
                <Checkbox
                  name="featured"
                  checked={formState.featured}
                  onChange={handleChange}
                />
              )}
              label="Featured?"
            />
          </FormGroup>
          <br />
          <br />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await updateCollection({
                  id: formState.id,
                  name: formState.name,
                  notes: formState.notes,
                  platform: formState.platform,
                  public: formState.public,
                  featured: formState.featured,
                }).unwrap();
                enqueueSnackbar('Saved changes', { variant: 'success' });
                navigate(`/collections/${collectionId}`);
              } catch (err) {
                const errorMsg = `Failed - ${err.data.message}`;
                enqueueSnackbar(errorMsg, { variant: 'error' });
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <h3>Add/Remove Sources</h3>
          <UploadSources collectionId={collectionId} />
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <SourceList collectionId={collectionId} edit />
        </div>
      </div>
    </div>
  );
}
