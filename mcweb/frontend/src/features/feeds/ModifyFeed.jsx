import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  TextField,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import dayjs from "dayjs";
import {
  useUpdateFeedMutation,
  useGetFeedQuery,
} from "../../app/services/feedsApi";
import { useLazyListSourcesQuery } from "../../app/services/sourceApi";
import { platformDisplayName, trimStringForDisplay } from "../ui/uiUtil";

const MIN_QUERY_LEN = 2; // don't query for super short things
const MAX_RESULTS = 10; // per endpoint
const MIN_POLL_MILLISECS = 500; // throttle requests
const MAX_MATCH_DISPLAY_LEN = 50; // make sure labels are too long

function ModifyFeed() {
  const [lastRequestTime, setLastRequestTime] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedSource, setSelectedSource] = React.useState({
    id: "",
    label: "",
  });
  const [sourceOptions, setSourceOptions] = React.useState([]);
  const [
    sourceTrigger,
    { isFetching: isSourceSearchFetching, data: sourceSearchResults },
  ] = useLazyListSourcesQuery();
  const navigate = useNavigate();
  const params = useParams();
  const autocompleteRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const feedId = Number(params.feedId); // get collection id from wildcard
  const { data, isLoading } = useGetFeedQuery(feedId);
  const [updateFeed] = useUpdateFeedMutation(feedId);

  // form state for text fields
  const [formState, setFormState] = useState({
    name: "",
    url: "",
    admin_rss_enabled: true,
  });

  const handleChange = ({ target: { name, value } }) =>
    setFormState((prev) => ({ ...prev, [name]: value }));

  const handleChangeSource = () => {
    setFormState((prev) => ({ ...prev, ["source"]: selectedSource.id }));
    handleClose();
  };

  const handleCheck = () =>
    setFormState((prev) => ({
      ...prev,
      admin_rss_enabled: !prev.admin_rss_enabled,
    }));

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  const handleClose = () => {
    setOpenDialog(false);
    if (autocompleteRef.current) {
      autocompleteRef.current.clearValue();
    }
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
  // handle source search results
  useEffect(() => {
    if (sourceSearchResults) {
      const existingOptionIds = sourceOptions
        .filter((o) => o.type == "source")
        .map((o) => o.id);
      const newOptions = sourceSearchResults.results.filter(
        (s) => !existingOptionIds.includes(s.id)
      );
      setSourceOptions(
        newOptions.slice(0, MAX_RESULTS).map((s) => ({
          displayGroup: "Sources",
          type: "source",
          id: s.id,
          value: s.id,
          label: `${trimStringForDisplay(
            s.label || s.name,
            MAX_MATCH_DISPLAY_LEN
          )} (${platformDisplayName(s.platform)})`,
        }))
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

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h2>Edit Feed </h2>
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
          <Autocomplete
            ref={autocompleteRef}
            id="quick-directory-search"
            open={open}
            filterOptions={(x) => x} /* let the server filter optons */
            onOpen={() => {}}
            onClose={() => {
              setOpen(false);
            }}
            blurOnSelect={true}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.label}
            noOptionsText="No matches"
            groupBy={(option) => option.displayGroup}
            options={[...sourceOptions]}
            loading={somethingIsFetching}
            onChange={defaultSelectionHandler}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Move feed to new source"
                value={formState.source}
                disabled={somethingIsFetching}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {somethingIsFetching ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                onKeyUp={(event) => {
                  if (event.key == "Enter") {
                    const { value } = event.target;
                    setOpen(true);
                    setSourceOptions([]);

                    // only search if str is long enough
                    if (value.length > MIN_QUERY_LEN) {
                      setLastRequestTime(Date.now());
                      sourceTrigger({ name: value });
                    }
                  }
                }}
              />
            )}
          />
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={handleCheck}
                  checked={formState.admin_rss_enabled}
                />
              }
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
                  feed: formState,
                });
                enqueueSnackbar("Saved changes", { variant: "success" });
                navigate(`/feeds/${feedId}`);
              } catch (err) {
                const errorMsg = `Failed - ${err.data.message}`;
                enqueueSnackbar(errorMsg, { variant: "error" });
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
              Assign new source?
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                This will move current feed to {selectedSource.label}
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
