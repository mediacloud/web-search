import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import InputLabel from '@mui/material/InputLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import { useSnackbar } from 'notistack';
import Select from '@mui/material/Select';
import { useUpdateCollectionMutation, useGetCollectionQuery } from '../../app/services/collectionsApi';
import SourceList from '../sources/SourceList';
import UploadSources from '../sources/UploadSources';
import { platformDisplayName, trimStringForDisplay } from '../ui/uiUtil';
import { useLazyListSourcesQuery } from '../../app/services/sourceApi';
import { useCreateSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';

const MIN_QUERY_LEN = 1; // don't query for super short things
const MAX_RESULTS = 10; // per endpoint
const MAX_MATCH_DISPLAY_LEN = 50; // make sure labels are too long

export default function ModifyCollection() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const collectionId = Number(params.collectionId); // get collection id from wildcard

  const { data, isLoading } = useGetCollectionQuery(collectionId);

  // form state for text fields
  const [formState, setFormState] = useState({
    id: 0, name: '', notes: '', platform: 'online_news', public: true, featured: false, rescrape: true, managed: false,
  });

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState({
    id: '',
    label: '',
  });
  const [sourceOptions, setSourceOptions] = useState([]);

  // formState declaration
  const handleChange = ({ target }) => {
    const newValue = (target.type === 'checkbox') ? target.checked : target.value;
    setFormState((prev) => ({ ...prev, [target.name]: newValue }));
  };

  // rtk operations
  const [updateCollection] = useUpdateCollectionMutation();
  const [createAssociation] = useCreateSourceCollectionAssociationMutation();

  const [
    sourceTrigger,
    { isFetching: isSourceSearchFetching, data: sourceSearchResults },
  ] = useLazyListSourcesQuery();

  const autocompleteRef = useRef(null);

  const handleAddSource = () => {
    createAssociation({ collection_id: collectionId, source_id: selectedSource.id });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

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
        rescrape: data.platform === 'online_news',
        managed: data.managed,
      };
      setFormState(formData);
    }
  }, [data]);

  // handle source search results
  useEffect(() => {
    if (sourceSearchResults) {
      const existingOptionIds = sourceOptions
        .filter((o) => o.type === 'source')
        .map((o) => o.id);
      const newOptions = sourceSearchResults.results.filter(
        (s) => !existingOptionIds.includes(s.id),
      );
      setSourceOptions(
        newOptions.slice(0, MAX_RESULTS).map((s) => ({
          displayGroup: 'Sources',
          type: 'source',
          id: s.id,
          value: s.id,
          label: `${trimStringForDisplay(
            s.label || s.name,
            MAX_MATCH_DISPLAY_LEN,
          )} (${platformDisplayName(s.platform)})`,
        })),
      );
    }
  }, [sourceSearchResults]);

  const somethingIsFetching = isSourceSearchFetching;

  useEffect(() => {
    if (!open) {
      setSourceOptions([]);
    }
  }, [open]);

  const defaultSelectionHandler = (e, value) => {
    if (value.id) {
      setSelectedSource({ id: value.id, label: value.label });
      handleOpenDialog();
    }
  };

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  const managedCollection = data.managed;

  return (
    <div className="container">
      {managedCollection && (
      <Alert severity="warning">
        This is a managed collection, to make any changes contact an admin
      </Alert>
      )}
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
            disabled={managedCollection}
          />
          <br />
          <br />
          <TextField
            fullWidth
            label="Notes"
            id="outlined-multiline-managed"
            name="notes"
            multiline
            rows={4}
            value={formState.notes}
            onChange={handleChange}
            disabled={managedCollection}
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
              disabled={managedCollection}
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
            <Permissioned role={ROLE_STAFF}>
              <FormControlLabel
                control={(
                  <Checkbox
                    name="managed"
                    checked={formState.managed}
                    onChange={handleChange}
                  />
)}
                label="Managed?"
              />
            </Permissioned>
            <FormControlLabel
              control={(
                <Checkbox
                  name="public"
                  checked={formState.public}
                  onChange={handleChange}
                  disabled={managedCollection}
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
                  disabled={managedCollection}
                />
              )}
              label="Featured?"
            />
          </FormGroup>
          <br />
          <br />
          <Button
            variant="contained"
            disabled={managedCollection}
            onClick={async () => {
              try {
                await updateCollection({
                  id: formState.id,
                  name: formState.name,
                  notes: formState.notes,
                  platform: formState.platform,
                  public: formState.public,
                  featured: formState.featured,
                  managed: formState.managed,
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
          <Autocomplete
            ref={autocompleteRef}
            id="quick-source-search"
            open={open}
            disabled={managedCollection}
            filterOptions={(x) => x} /* let the server filter optons */
            onOpen={() => {}}
            onClose={() => {
              setOpen(false);
            }}
            blurOnSelect
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.label}
            noOptionsText="No matches"
            groupBy={(option) => option.displayGroup}
            options={[...sourceOptions]}
            loading={somethingIsFetching}
            onChange={defaultSelectionHandler}
            renderInput={(renderParams) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...renderParams}
                label="Add a source to this collection"
                value={formState.source}
                disabled={somethingIsFetching}
                InputProps={{
                  ...renderParams.InputProps,
                  endAdornment: (
                    <>
                      {somethingIsFetching ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {renderParams.InputProps.endAdornment}
                    </>
                  ),
                }}
                onKeyUp={(event) => {
                  if (event.key === 'Enter') {
                    const { value } = event.target;
                    setOpen(true);
                    setSourceOptions([]);

                    // only search if str is long enough
                    if (value.length > MIN_QUERY_LEN) {
                      // setLastRequestTime(Date.now());
                      sourceTrigger({ name: value });
                    }
                  }
                }}
              />
            )}
          />
          <br />

        </div>

        <div style={{ display: 'flex' }}>
          {formState.platform === 'online_news' && (

          <FormControlLabel
            control={(
              <Checkbox
                name="rescrape"
                checked={formState.rescrape}
                onChange={handleChange}
                disabled={managedCollection}
              />
              )}
            label="Automatically discover RSS feeds in new sources?"
          />
          )}

          <UploadSources
            className="col-6"
            collectionId={collectionId}
            rescrape={formState.rescrape}
            managedCollection={managedCollection}
          />
        </div>

      </div>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          Add Selected Source to Current Collection?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Add source {selectedSource.label} to collection {formState.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSource}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <div className="row">
        <div className="col-12">
          <SourceList collectionId={collectionId} edit managedCollection={managedCollection} />
        </div>
      </div>
    </div>
  );
}
