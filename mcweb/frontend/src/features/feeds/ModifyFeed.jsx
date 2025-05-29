import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import {
  useUpdateFeedMutation,
  useGetFeedQuery,
} from '../../app/services/feedsApi';
import { useLazyListSourcesQuery, useGetSourceQuery } from '../../app/services/sourceApi';
import { platformDisplayName, trimStringForDisplay } from '../ui/uiUtil';

const MIN_QUERY_LEN = 1; // don't query for super short things
const MAX_RESULTS = 10; // per endpoint
// const MIN_POLL_MILLISECS = 500; // throttle requests
const MAX_MATCH_DISPLAY_LEN = 50; // make sure labels are too long

function ModifyFeed() {
  const navigate = useNavigate();
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const feedId = Number(params.feedId);

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const [selectedSource, setSelectedSource] = useState({
    id: '',
    label: '',
  });

  const [sourceOptions, setSourceOptions] = useState([]);

  const [
    sourceTrigger,
    { isFetching: isSourceSearchFetching, data: sourceSearchResults },
  ] = useLazyListSourcesQuery();

  const autocompleteRef = useRef(null);

  const { data, isLoading } = useGetFeedQuery(feedId);

  const {
    data: sourceData,
    isLoading: isSourceLoading,
  } = useGetSourceQuery(data.source);

  const [updateFeed] = useUpdateFeedMutation(feedId);

  const [formState, setFormState] = useState({
    name: '',
    url: '',
    admin_rss_enabled: true,
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }));

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleChangeSource = () => {
    setFormState((prev) => ({ ...prev, source: selectedSource.id }));
    handleClose();
  };

  const handleCheck = () => setFormState((prev) => ({
    ...prev,
    admin_rss_enabled: !prev.admin_rss_enabled,
  }));

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  useEffect(() => {
    if (data) {
      const formData = {
        id: data.id,
        name: data.name,
        url: data.url,
        admin_rss_enabled: data.admin_rss_enabled,
        source: data.source,
        created: dayjs(data.created_at).format(),
        modified: dayjs(data.modified_at).format(),
      };
      setFormState(formData);
    }
  }, [data]);

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

  if (isLoading || isSourceLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h2>Edit Feed</h2>
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
            label="URL"
            id="outlined-multiline-static"
            name="url"
            value={formState.url}
            onChange={handleChange}
          />
          <br />
          <br />
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Parent Source</b>: {sourceData.name}
          </p>
          <h3>Change Feed Parent Source</h3>
          <br />
          {/* SHOULD MAKE A REUSABLE AUTOCOMPLETE, for this and ModifyCollection */}
          <Autocomplete
            ref={autocompleteRef}
            id="quick-source-search"
            open={open}
            filterOptions={(x) => x} // let the server filter optons
            onOpen={() => {}}
            onClose={() => {
              setOpen(false);
            }}
            blurOnSelect
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.label || ''}
            noOptionsText="No matches"
            groupBy={(option) => option.displayGroup || ''}
            options={[...sourceOptions]}
            defaultValue={sourceData.name || ''}
            loading={isSourceSearchFetching}
            onChange={defaultSelectionHandler}
            renderInput={(inputParams) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...inputParams}
                label="Parent Source"
                value={formState.source}
                disabled={isSourceSearchFetching}
                InputProps={{
                  ...inputParams.InputProps,
                  endAdornment: (
                    <>
                      {isSourceSearchFetching ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {inputParams.InputProps.endAdornment}
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
                      sourceTrigger({ name: value.trim() });
                    }
                  }
                }}
              />
            )}
          />
          <FormControl>
            <FormControlLabel
              control={(
                <Checkbox
                  onChange={handleCheck}
                  checked={formState.admin_rss_enabled}
                />
              )}
              label="Admin enabled?"
            />
          </FormControl>
          <br />
          <br />
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await updateFeed({
                  feed: {
                    id: formState.id,
                    name: formState.name.trim(),
                    url: formState.url.trim(),
                    admin_rss_enabled: formState.admin_rss_enabled,
                    source: formState.source,
                  },
                });
                enqueueSnackbar('Saved changes', { variant: 'success' });
                navigate(`/feeds/${feedId}`);
              } catch (err) {
                const errorMsg = `Failed - ${err.data.message}`;
                enqueueSnackbar(errorMsg, { variant: 'error' });
              }
            }}
          >
            Save
          </Button>
          <Dialog
            open={openDialog}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              Assign feed {formState.name} to new source?
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Please confirm you would like to move current feed to {selectedSource.label}.
                Then, click save, to save this change.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleChangeSource}>Confirm</Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default ModifyFeed;
