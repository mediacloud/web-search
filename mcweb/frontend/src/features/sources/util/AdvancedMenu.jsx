import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import PropTypes from 'prop-types';
import AlertDialog from '../../ui/AlertDialog';
import { trimStringForDisplay, platformDisplayName } from '../../ui/uiUtil';
import { PermissionedStaff, PermissionedContributor, ROLE_STAFF } from '../../auth/Permissioned';
import { useCreateAlternativeDomainMutation } from '../../../app/services/alternativeDomainsApi';
import { useLazyListSourcesQuery, useDeleteSourceMutation } from '../../../app/services/sourceApi';

const MIN_QUERY_LEN = 3; // don't query for super short things
const MAX_RESULTS = 10; // per endpoint
const MAX_MATCH_DISPLAY_LEN = 50; // make sure labels are too long

export default function AdvancedMenu({
  source,
}) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const autocompleteRef = useRef(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [openCreateAlternativeDomain, setOpenCreateAlternativeDomain] = useState(false);
  const [openNewAlternativeDomain, setOpenNewAlternativeDomain] = useState(false);
  const [alternativeDomain, setAlternativeDomain] = useState('');
  const [sourceOptions, setSourceOptions] = useState([]);
  const [openAdConfirm, setOpenAdConfirm] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [selectedSource, setSelectedSource] = useState({
    id: '',
    label: '',
  });

  const [createAlternativeDomain,
    { data: altDomain, error: alternativeDomainError }] = useCreateAlternativeDomainMutation();

  const [
    sourceTrigger,
    { isFetching: isSourceSearchFetching, data: sourceSearchResults },
  ] = useLazyListSourcesQuery();

  const [deleteSource] = useDeleteSourceMutation();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenAdvanced(true);
  };

  const defaultSelectionHandler = (e, value) => {
    if (value.id) {
      setSelectedSource({ id: value.id, label: value.label, name: value.name });
      setOpenCreateAlternativeDomain(true);
    }
  };

  const handleConvertIntoAlternativeDomain = () => {
    createAlternativeDomain({ source_id: selectedSource.id, alternative_domain_id: source.id });
    setOpenAdvanced(false);
    setOpenCreateAlternativeDomain(false);
    setOpenAdConfirm(false);
    navigate(`/sources/${selectedSource.id}`);
    enqueueSnackbar(
      `Source #${source.id} (${source.name}) converted into an alternative domain  
      for Source #${selectedSource.id} (${selectedSource.name})`,
      { variant: 'success' },
    );
  };

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
          name: s.name,
          label: `${trimStringForDisplay(
            s.label || s.name,
            MAX_MATCH_DISPLAY_LEN,
          )}`,
        })),
      );
    }
  }, [sourceSearchResults]);

  useEffect(() => {
    if (altDomain) {
      setOpenNewAlternativeDomain(false);
      setOpenAdvanced(false);
    }
  }, [altDomain]);

  return (
    <>
      <Button
        onClick={handleMenuOpen}
        variant="outlined"
        startIcon={(
          <LockOpenIcon
            titleAccess="admin-advanced"
          />
        )}
        endIcon={<KeyboardArrowDown />}
        disabled={!!source.url_search_string}
      >
        Advanced Options
      </Button>
      <Menu
        open={openAdvanced}
        onClose={() => setOpenAdvanced(false)}
        maxWidth="md"
        fullWidth
        anchorEl={anchorEl}
      >
        <MenuItem>
          {/* CONVERT SOURCE TO AD SEARCH MODAL  */}
          <PermissionedStaff role={ROLE_STAFF}>
            <Button
              onClick={() => setOpenCreateAlternativeDomain(true)}
              startIcon={(
                <LockOpenIcon
                  titleAccess="convert-source-to-ad"
                />
            )}
              disabled={!!source.url_search_string}
            >
              Convert Source Into Alternative Domain...
            </Button>
            <Dialog
              open={openCreateAlternativeDomain}
              onClose={() => setOpenCreateAlternativeDomain(false)}
            >
              {alternativeDomainError && (
              <Alert severity="error" sx={{ marginBottom: '10px' }}>
                Error creating alternative domain:
                {' '}
                {/*  eslint-disable-next-line no-console */}
                {alternativeDomainError?.data || console.error(alternativeDomainError)}
              </Alert>
              )}
              <DialogTitle id="alert-dialog-title">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Choose a Source for {source.name} to be converted into to an Alternative Domain.
              </DialogTitle>
              <DialogContent>
                <Alert severity="error" sx={{ marginBottom: '10px' }}>
                  Converting a source into an alternative domain will delete the source,
                  this change can not be undone.
                </Alert>
                <DialogContentText sx={{ marginBottom: '10px' }}>
                  First search for a source in the searchbar and hit &quot;Enter&quot; to search.
                  Then click a source and &quot;Submit&quot; when the correct source is selected.
                </DialogContentText>
                <Autocomplete
                  ref={autocompleteRef}
                  id="quick-source-search"
                  open={openSearch}
                  filterOptions={(x) => x} /* let the server filter optons */
                  onOpen={() => {}}
                  onClose={() => {
                    setOpenSearch(false);
                  }}
                  blurOnSelect
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.label}
                  noOptionsText="No matches"
                  groupBy={(option) => option.displayGroup}
                  options={[...sourceOptions]}
                  loading={isSourceSearchFetching}
                  onChange={defaultSelectionHandler}
                  renderInput={(renderParams) => (
                    <TextField
                    // eslint-disable-next-line react/jsx-props-no-spreading
                      {...renderParams}
                      label="Find a source to create an alternative domain for"
                      value={source}
                      disabled={isSourceSearchFetching}
                      InputProps={{
                        ...renderParams.InputProps,
                        endAdornment: (
                          <>
                            {isSourceSearchFetching ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {renderParams.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      onKeyUp={(event) => {
                        if (event.key === 'Enter') {
                          const { value } = event.target;
                          setOpenSearch(true);
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
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenCreateAlternativeDomain(false)}>Cancel</Button>
                <Button
                  onClick={() => setOpenAdConfirm(true)}
                  disabled={!selectedSource.id}
                >
                  Submit
                </Button>
              </DialogActions>
            </Dialog>

            {/* CONVERTING SOURCE TO ALTERNATIVE DOMAIN CONFIRMATION MODAL */}
            <Dialog
              open={openAdConfirm}
              onClose={() => setOpenAdConfirm(false)}
            >
              <DialogTitle>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Are you sure you want to turn this source into an alternative domain for another source?
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                  Are you sure you want to turn {source.label || source.name} into an alternative domain for
                  {' '}
                  {selectedSource.label || selectedSource.name}
                  ? This will delete
                  {' '}
                  {source.label || source.name}
                  {' '}
                  and will transfer all collections and feeds to
                  {' '}
                  {selectedSource.label || selectedSource.name}
                  .
                </DialogContentText>
                <Alert severity="error" sx={{ marginTop: '10px' }}>
                  Converting a source into an alternative domain will delete the source,
                  this change can not be undone.
                </Alert>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenAdConfirm(false)}>Cancel</Button>
                <Button
                  onClick={handleConvertIntoAlternativeDomain}
                >
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>

          </PermissionedStaff>
        </MenuItem>
        <MenuItem>
          <PermissionedContributor>
            <Button
              onClick={() => setOpenNewAlternativeDomain(true)}
              startIcon={(
                <LockOpenIcon
                  titleAccess="create-alternative-domain"
                />
            )}
              disabled={!!source.url_search_string}
            >
              Create Alternative Domain...
            </Button>

            <Dialog
              open={openNewAlternativeDomain}
              onClose={() => setOpenNewAlternativeDomain(false)}
            >
              {alternativeDomainError && (
                <Alert severity="error" sx={{ marginBottom: '10px' }}>
                  Error creating alternative domain:
                  {' '}
                  {/*  eslint-disable-next-line no-console */}
                  {alternativeDomainError?.data || console.error(alternativeDomainError)}
                </Alert>
              )}
              <DialogTitle>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Add an Alternative Domain for {source.name},{' '}
                this should be the canonical domain and should not be a source already.
              </DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  id="ad-name"
                  label="Alternative Domain"
                  type="text"
                  fullWidth
                  variant="standard"
                  onChange={(e) => setAlternativeDomain(e.target.value)}
                  value={alternativeDomain || ''}
                  placeholder="eg...huffpost.com"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenNewAlternativeDomain(false)}>Cancel</Button>
                <Button onClick={() => createAlternativeDomain({ source_id: source.id, alternative_domain: alternativeDomain })}>
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>

          </PermissionedContributor>
        </MenuItem>
        {/* DELETE SOURCE */}
        <MenuItem>
          <PermissionedStaff role={ROLE_STAFF}>
            <AlertDialog
              outsideTitle="Delete Source"
              title={`Delete ${platformDisplayName(source.platform)} Source #${source.id}: ${source.name}`}
              content={`Are you sure you want to delete ${platformDisplayName(source.platform)}
                          Source #${source.id}: ${source.name} permanently?`}
              dispatchNeeded={false}
              action={deleteSource}
              actionTarget={source.id}
              snackbar
              snackbarText="Source Deleted!"
              onClick={() => setOpenDelete(true)}
              openDialog={openDelete}
              variant="text"
              navigateNeeded
              navigateTo="/directory"
              startIcon={<LockOpenIcon titleAccess="admin-delete" />}
              secondAction={false}
              confirmButtonText="delete"
            />
          </PermissionedStaff>
        </MenuItem>

      </Menu>
    </>
  );
}

AdvancedMenu.propTypes = {
  source: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    url_search_string: PropTypes.string,
  }).isRequired,
};
