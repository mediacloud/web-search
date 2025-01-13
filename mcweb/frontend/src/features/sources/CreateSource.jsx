import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useCreateSourceMutation } from '../../app/services/sourceApi';
import { mediaTypeDisplayName } from '../ui/uiUtil';
import Header from '../ui/Header';
import validateURLSearchString from './util/validateURLSearchString';

export default function CreateCollection() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '',
    notes: '',
    homepage: '',
    label: '',
    platform: 'online_news',
    url_search_string: '',
    media_type: '',
    collections: [],
    url_search_stringErrors: null,
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createSource] = useCreateSourceMutation();

  return (
    <>
      <Header>
        <h1>
          Create a Source
        </h1>
      </Header>

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
              <h3>Error While Creating Source</h3>
              <p>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                {errorMessage}
              </p>
            </div>
          </Alert>
        </Modal>
        <div className="row">
          <div className="col-12">
            <form action="">

              {/* <FormControl fullWidth>
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
              <br /> */}

              <TextField
                fullWidth
                name="name"
                label="Canonical Domain"
                helperText="This is the identified and normalized domain for this source within our system.
                Don't change this unless you know what you're doing. For news sources this should be the canonical domain name."
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
                required
              />
              <br />
              <br />
              <TextField
                fullWidth
                name="label"
                label="Label"
                value={formState.label}
                onChange={handleChange}
                helperText="The human-readable name shown to people for this source. Leave
                empty to have the canonical domain be the label."
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
              (such as news.bbc.co.uk/nigeria). If this is one of those exceptions, enter a wild-carded search string
              here, such as 'news.bbc.co.uk/nigeria/*'. This source should not have feeds."
              />
              <br />
              <br />

              <Button
                variant="contained"
                type="button"
                onClick={async () => {
                  const validSearchString = validateURLSearchString(formState.url_search_string);
                  if (!validSearchString) {
                    setFormState({ url_search_stringErrors: null });
                    createSource(formState)
                      .then((payload) => {
                        if (payload.error) {
                          if (payload.error.data.detail) {
                            setErrorMessage(payload.error.data.detail);
                            setOpen(true);
                          } else {
                            setErrorMessage(payload.error.data[0]);
                            setOpen(true);
                          }
                        } else {
                          const sourceId = payload.data.source.id;
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
                Create
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
