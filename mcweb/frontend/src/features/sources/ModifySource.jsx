import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Modal from '@mui/material/Modal';
import Alert from '@mui/material/Alert';
import { useSnackbar } from 'notistack';
import CollectionList from '../collections/CollectionList';
import { useCreateSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { useGetSourceQuery, useUpdateSourceMutation } from '../../app/services/sourceApi';
import { useDeleteAlternativeDomainMutation } from '../../app/services/alternativeDomainsApi';
import DirectorySearch from '../directory/DirectorySearch';
import validateURLSearchString from './util/validateURLSearchString';

export default function ModifySource() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const sourceId = Number(params.sourceId);

  const [formState, setFormState] = React.useState({
    name: '',
    notes: '',
    homepage: '',
    label: '',
    service: '',
    platform: 'online_news',
    url_search_string: '',
    media_type: '',
    primary_language: '',
    pub_country: '',
    pub_state: '',
    url_search_stringErrors: '',
    alternative_domains: [],
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  // update
  const [updateSource] = useUpdateSourceMutation();
  const [deleteAlternativeDomain] = useDeleteAlternativeDomainMutation();

  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data,
    isLoading,
  } = useGetSourceQuery(sourceId);

  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id,
        name: data.name,
        notes: data.notes,
        homepage: data.homepage,
        label: data.label,
        platform: 'online_news',
        url_search_string: data.url_search_string ? data.url_search_string : '',
        media_type: data.media_type ? data.media_type : '',
        pub_country: data.pub_country,
        pub_state: data.pub_state,
        alternative_domains: data.alternative_domains || [],
      };
      setFormState(formData);
    }
  }, [data]);

  const [collectionId, setCollectionId] = useState('');

  const [createSourceCollectionAssociation] = useCreateSourceCollectionAssociationMutation();

  const prepareSource = (formData) => {
    const preparedSource = {};
    Object.keys(formData).forEach((column) => {
      if ((formData[column] && formData[column] !== '') || column === 'url_search_string') {
        if (typeof formData[column] === 'string') {
          preparedSource[column] = formData[column].trim();
        } else {
          preparedSource[column] = formData[column];
        }
      }
    });
    return preparedSource;
  };

  const handleDeleteAlternativeDomain = (aD) => {
    deleteAlternativeDomain(aD.id);
    enqueueSnackbar('Deleted Alternative Domain', { variant: 'success' });
  };

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  document.title = formState.label ? `Edit ${formState.label} | Media Cloud` : `Edit ${formState.name} | Media Cloud`;

  return (
    <div className="container">
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Alert severity="error">

          <div
            className="container"

          >
            <h3>Error While Updating Source</h3>
            <p>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              {errorMessage}
            </p>
          </div>
        </Alert>
      </Modal>
      <div className="row">
        <div className="col-6">
          <h2>Edit Source</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-8">
          <TextField
            fullWidth
            name="name"
            label="Canonical Domain"
            helperText="This is the identified and normalized domain for this source within our system.
                Don't change this unless you know what you're doing. For news sources this should be the canonical domain name."
            value={formState.name ? formState.name : 'enter canonical domain'}
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
            helperText="The human-readable name shown to people for this source.
            Leave empty to have the canonical domain be the label."
          />
          <br />
          <br />
          {formState.url_search_stringErrors && (
          <p style={{ color: 'red', marginLeft: '5px' }}>
            {formState.url_search_stringErrors}
          </p>
          )}
          <TextField
            fullWidth
            name="url_search_string"
            label="URL Search String"
            value={formState.url_search_string}
            onChange={handleChange}
            helperText="For a very small number of news sources, we want to search within a subdomain
            (such as news.bbc.co.uk/nigeria). If this is one of those exceptions, enter a wild-carded search string here,
            such as '*news.bbc.co.uk/nigeria/*'."
          />
          <br />
          <br />
          <TextField
            fullWidth
            name="pub_country"
            label="Publication Country"
            value={formState.pub_country}
            onChange={handleChange}
            helperText="Publication country code, country code should be valid ISO 3166-1 alpha-3"
          />
          <br />
          <br />
          <TextField
            fullWidth
            name="pub_state"
            label="Publication State"
            value={formState.pub_state}
            onChange={handleChange}
            helperText="Publication State code, should be valid ISO 3166-2"
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
              <MenuItem value="audio_broadcast">Audio Broadcast</MenuItem>
              <MenuItem value="digital_native">Digital Native</MenuItem>
              <MenuItem value="print_native">Print Native</MenuItem>
              <MenuItem value="video_broadcast">Video Broadcast</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <br />
          <br />
          <Button
            variant="contained"
            onClick={() => {
              const preparedSource = prepareSource(formState);
              const validSearchString = validateURLSearchString(formState.url_search_string);
              if (!validSearchString) {
                updateSource(preparedSource)
                  .then((payload) => {
                    if (payload.error) {
                      setErrorMessage(payload.error.data.detail);
                      setOpen(true);
                    } else {
                      enqueueSnackbar('Saved changes', { variant: 'success' });
                      navigate(`/sources/${sourceId}`);
                    }
                  });
              } else {
                setFormState({ url_search_stringErrors: validSearchString });
                setErrorMessage('Please check url search string');
                setOpen(true);
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
          <hr />
        </div>
      </div>

      <div className="row">
        <table width="100%">
          <thead>
            <tr>
              <Tooltip
                title="The domain that uniquely identifies the Source within our system for
                searching against the Online News Archive."
              >
                <th>Domains</th>
              </Tooltip>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {formState.name}
              </td>
            </tr>
            {formState.alternative_domains.map((aD, i) => (
              <tr key={aD ? aD.id : i}>
                <td>
                  {aD.domain}
                </td>
                <td>
                  <IconButton
                    aria-label="remove"
                    onClick={() => handleDeleteAlternativeDomain(aD)}
                    title="Delete Alternative Domain"
                  >
                    <HighlightOffIcon />
                  </IconButton>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>

      <div className="row">
        <div className="col-12">
          <hr />
        </div>
      </div>

      <div className="row">
        <div className="col-3">
          <h2>Add to Collection:</h2>
        </div>
        <div className="col-7">
          <DirectorySearch searchSources={false} onSelected={(e, value) => setCollectionId(value.id)} />
        </div>
        <div className="col-2">
          <Button onClick={async () => {
            const assoc = { source_id: sourceId, collection_id: collectionId };
            await createSourceCollectionAssociation(assoc);
            setCollectionId('');
          }}
          >
            Save
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
