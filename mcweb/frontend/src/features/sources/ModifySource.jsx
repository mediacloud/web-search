import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router'
// import { useCSVDownloader } from 'react-papaparse';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useSnackbar } from 'notistack';
import { platformDisplayName } from '../ui/uiUtil';
import CollectionList from '../collections/CollectionList';
import { useCreateSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import {
  useGetSourceQuery,
  useUpdateSourceMutation,
}
  from '../../app/services/sourceApi';

export default function ModifySource() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const sourceId = Number(params.sourceId);
  const [formState, setFormState] = React.useState({
    name: '', notes: '', homepage: '', label: '', service: '', platform: '', url_search_string: '',
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  // const { CSVDownloader, Type } = useCSVDownloader();

  // create
  // const [post, { setPost }] = usePostSourceMutation();

  // update
  const [updateSource] = useUpdateSourceMutation();

  // delete
  // const [remove, { setRemove }] = useDeleteSourceMutation();

  const {
    data,
    isLoading,
  } = useGetSourceQuery(sourceId);

  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id, name: data.name, notes: data.notes, homepage: data.homepage, label: data.label, platform: data.platform,
      };
      setFormState(formData);
    }
  }, [data]);
  const [collectionId, setCollectionId] = useState('');

  const collectionData = useGetCollectionQuery(collectionId);

  const [createSourceCollectionAssociation] = useCreateSourceCollectionAssociationMutation();

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <div className="container">

      <div className="row">
        <div className="col-6">
          <h2>Edit Source</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-8">

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
            value={formState.name ? formState.name : 'enter name'}
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
            value={formState.notes === null ? '' : formState.notes}
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
            value={formState.label ? formState.label : null}
            onChange={handleChange}
            helperText="The human-readable name shown to people for this source. Leave empty to have the domain be the name."
          />
          <br />
          <br />
          <TextField
            fullWidth
            name="url_search_string"
            label="URL Search String"
            value={formState.url_search_string ? formState.url_search_string : null}
            onChange={handleChange}
            helperText="For a very small number of news sources, we want to search within a subdomain (such as news.bbc.co.uk/nigeria). If this is one of those exceptions, enter a wild-carded search string here, such as '*news.bbc.co.uk/nigeria/*'."
          />
          <br />
          <br />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const updatedSource = await updateSource(formState).unwrap()
                enqueueSnackbar('Saved changes', { variant: 'success' });
                navigate(`/sources/${sourceId}`);
              } catch (err) {
                console.log(err);
                const errorMsg = `Failed - ${err.data.message}`;
                enqueueSnackbar(errorMsg, { variant: 'error' });
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Assocation Content */}

      <div className="row">
        <div className="col-12">

          <h2> Add to Collection (enter the collection ID): </h2>
          <input type="text" value={collectionId} onChange={(e) => setCollectionId(Number(e.target.value))} />

          <Button onClick={() => {
            const assoc = { source_id: sourceId, collection_id: collectionId };
            const collection = collectionData.data;
            createSourceCollectionAssociation(assoc);
            setCollectionId('');
          }}
          >
            Add Collection
          </Button>

        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <CollectionList edit sourceId={sourceId} />
        </div>
      </div>

    </div>

  );
}
