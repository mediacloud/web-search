import React, { useState, useRef, useEffect } from 'react';
import {
  useParams, Link, Outlet, useNavigate,
} from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import CircularProgress from '@mui/material/CircularProgress';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockClosedIcon from '@mui/icons-material/Lock';
import ListAltIcon from '@mui/icons-material/ListAlt';
import {
  useGetSourceQuery, useDeleteSourceMutation, useRescrapeForFeedsMutation, useLazyListSourcesQuery,
} from '../../app/services/sourceApi';
import { useLazyFetchFeedQuery, useListFeedsQuery } from '../../app/services/feedsApi';
import { useCreateAlternativeDomainMutation } from '../../app/services/alternativeDomainsApi';
import { PermissionedContributor, PermissionedStaff, ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { platformDisplayName, platformIcon, trimStringForDisplay } from '../ui/uiUtil';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';
import AlertDialog from '../ui/AlertDialog';
import MediaNotFound from '../ui/MediaNotFound';

const MIN_QUERY_LEN = 1; // don't query for super short things
const MAX_RESULTS = 10; // per endpoint
const MAX_MATCH_DISPLAY_LEN = 50; // make sure labels are too long

export default function SourceHeader() {
  const params = useParams();
  const navigate = useNavigate();
  const sourceId = Number(params.sourceId);

  const [openRefetch, setOpenRefetch] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openRescrape, setOpenRescrape] = useState(false);
  const [openCreateAlternativeDomain, setOpenCreateAlternativeDomain] = useState(false);
  const [openNewAlternativeDomain, setOpenNewAlternativeDomain] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openAdConfirm, setOpenAdConfirm] = useState(false);
  const [alternativeDomain, setAlternativeDomain] = useState('');
  const [sourceOptions, setSourceOptions] = useState([]);
  const [selectedSource, setSelectedSource] = useState({
    id: '',
    label: '',
  });

  const autocompleteRef = useRef(null);

  const {
    data: source,
    isLoading,
    error,
  } = useGetSourceQuery(sourceId);

  const {
    data: feeds,
    isLoading: feedsAreLoading,
  } = useListFeedsQuery({ source_id: sourceId });

  const [
    sourceTrigger,
    { isFetching: isSourceSearchFetching, data: sourceSearchResults },
  ] = useLazyListSourcesQuery();

  const [fetchFeedTrigger] = useLazyFetchFeedQuery();
  const [deleteSource] = useDeleteSourceMutation();
  const [scrapeForFeeds] = useRescrapeForFeedsMutation();
  const [createAlternativeDomain,
    { error: alternativeDomainError }] = useCreateAlternativeDomainMutation();

  // Handle when user wants to turn this source into an alternative domain, this will delete the source and move
  // the sources feeds and collection to the alternative domain source
  const handleCreateAlternativeDomain = async () => {
    try {
      await createAlternativeDomain({ source_id: selectedSource.id, alternative_domain_id: sourceId });
      navigate(`/sources/${selectedSource.id}`);
      setOpenAdConfirm(false);
      setOpenCreateAlternativeDomain(false);
    } catch (e) {
      setOpenAdConfirm(false);
      setOpenCreateAlternativeDomain(false);
    }
  };

  const handleAddAlternativeDomain = async () => {
    try {
      await createAlternativeDomain({ source_id: sourceId, alternative_domain: alternativeDomain });
    } catch (e) {
      setOpenNewAlternativeDomain(false);
      return;
    }
    setOpenNewAlternativeDomain(false);
  };

  const defaultSelectionHandler = (e, value) => {
    if (value.id) {
      setSelectedSource({ id: value.id, label: value.label, name: value.name });
      setOpenCreateAlternativeDomain(true);
    }
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

  if (isLoading || feedsAreLoading) {
    return <CircularProgress size="75px" />;
  }

  if (error) { return <MediaNotFound source />; }

  const PlatformIcon = platformIcon(source.platform);
  const feedCount = feeds ? feeds.count : 0;

  return (
    <>
      <Header>
        <span className="small-label">
          {platformDisplayName(source.platform)}
          {' '}
          Source #
          {sourceId}
        </span>
        <h1>
          <Link style={{ textDecoration: 'none', color: 'black' }} to={`/sources/${sourceId}`}>
            <PlatformIcon titleAccess={source.name} fontSize="large" />
            &nbsp;
            {source.label || source.name}
          </Link>
        </h1>
        {source.url_search_string && (
          <Tooltip title="A Child Source is a subdomain of a parent source, but queries target only this subdomain.
          It should have no feeds of its own, only a URL search string, while all feeds remain attached to the parent source."
          >
            <Chip label="Child Source" color="warning" />
          </Tooltip>
        )}
      </Header>
      <ControlBar>
        {alternativeDomainError && (
        <Alert sx={{ marginBottom: '10px' }} severity="error">
          {alternativeDomainError.data || 'An error occurred while creating the alternative domain.'}
        </Alert>
        )}
        <Button variant="outlined" startIcon={<SearchIcon titleAccess="search our directory" />}>
          <a
            href={`/search?${urlSerializer([{
              queryList: defaultPlatformQuery(source.platform),
              anyAll: 'any',
              negatedQueryList: [],
              startDate: dayjs().subtract(35, 'day'),
              endDate: dayjs().subtract(5, 'day'),
              collections: [],
              sources: [source.id],
              platform: defaultPlatformProvider(source.platform),
              advanced: false,
            }])}`}
            target="_blank"
            rel="noreferrer"
          >
            Search Content
          </a>
        </Button>

        <Button variant="outlined" startIcon={<HomeIcon titleAccess="visit this sources homepage" />}>
          <a href={source.homepage} target="_blank" rel="noreferrer">Visit Homepage</a>
        </Button>

        <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin-edit" />}>
          <Link to={`/sources/${sourceId}/edit`}>Edit Source</Link>
        </Button>

        <PermissionedStaff role={ROLE_STAFF}>
          <AlertDialog
            outsideTitle="Delete Source"
            title={`Delete ${platformDisplayName(source.platform)} Source #${sourceId}: ${source.name}`}
            content={`Are you sure you want to delete ${platformDisplayName(source.platform)}
                Source #${sourceId}: ${source.name} permanently?`}
            dispatchNeeded={false}
            action={deleteSource}
            actionTarget={sourceId}
            snackbar
            snackbarText="Source Deleted!"
            onClick={() => setOpenDelete(true)}
            openDialog={openDelete}
            variant="outlined"
            navigateNeeded
            navigateTo="/directory"
            startIcon={<LockOpenIcon titleAccess="admin-delete" />}
            secondAction={false}
            confirmButtonText="delete"
          />
        </PermissionedStaff>

        {source.url_search_string && (
          <Button
            variant="outlined"
            disabled
            startIcon={(
              <LockClosedIcon
                titleAccess="child sources should not have feeds"
              />
                    )}
          >
            Child Sources should not have feeds
          </Button>
        )}

        {!source.url_search_string && (
          <Button
            variant="outlined"
            startIcon={(
              <ListAltIcon
                titleAccess="source's feeds page"
              />
            )}
          >
            <Link
              to={`/sources/${sourceId}/feeds`}
            >
              {feedCount === 0 ? 'Add Feeds' : `List Feeds (${feedCount}) `}
            </Link>
          </Button>
        )}

        <PermissionedContributor>
          <AlertDialog
            outsideTitle="Refetch Feeds"
            title={`Refetch all of ${source.name} feeds`}
            content="Are you sure you would like to refetch all feeds for this source?
                      After confirming the feeds will be queued for refetching.
                      You can check back at this page in a few minutes to see changes"
            dispatchNeeded={false}
            action={fetchFeedTrigger}
            actionTarget={{ source_id: sourceId }}
            snackbar
            snackbarText="Feeds Queued!"
            onClick={() => setOpenRefetch(true)}
            openDialog={openRefetch}
            variant="outlined"
            startIcon={<LockOpenIcon titleAccess="admin-edit" />}
            secondAction={false}
            confirmButtonText="refetch feeds"
            disabled={!!source.url_search_string}
          />

          {!source.url_search_string && (
            <Button variant="outlined" startIcon={<LockOpenIcon titleAccess="admin-create" />}>
              <Link to={`/sources/${sourceId}/feeds/create`}>Create Feed</Link>
            </Button>
          )}

          {source.platform === 'online_news' && (

            <AlertDialog
              outsideTitle="Rescrape Source"
              title={`Rescrape Source ${source.name} for new Feeds`}
              content={`Are you sure you would like to rescrape ${source.name} for new feeds?
             Confirming will place this source in a queue to be rescraped for new feeds`}
              dispatchNeeded={false}
              action={scrapeForFeeds}
              actionTarget={sourceId}
              snackbar
              snackbarText="Source Queued for Rescraping"
              onClick={() => setOpenRescrape(true)}
              openDialog={openRescrape}
              variant="outlined"
              navigateNeeded={false}
              startIcon={<LockOpenIcon titleAccess="admin-delete" />}
              secondAction={false}
              confirmButtonText="Rescrape"
              disabled={!!source.url_search_string}
            />
          )}
        </PermissionedContributor>

        <PermissionedStaff role={ROLE_STAFF}>
          <Button
            onClick={() => setOpenCreateAlternativeDomain(true)}
            variant="outlined"
            startIcon={(
              <LockOpenIcon
                titleAccess="admin-delete"
              />
            )}
            disabled={!!source.url_search_string}
          >
            Turn Source Into Alternative Domain
          </Button>
          <Dialog
            open={openCreateAlternativeDomain}
            onClose={() => setOpenCreateAlternativeDomain(false)}
          >
            <DialogTitle id="alert-dialog-title">
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              Choose a Source to Create Alternative Domain for {source.name}.
              {' '}
            </DialogTitle>
            <DialogContent>
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
          {/* Turn source into alternative domain confirmation modal */}
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
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdConfirm(false)}>Cancel</Button>
              <Button onClick={() => handleCreateAlternativeDomain()}>Confirm</Button>
            </DialogActions>
          </Dialog>
        </PermissionedStaff>
        <PermissionedContributor>
          <Button
            onClick={() => setOpenNewAlternativeDomain(true)}
            variant="outlined"
            startIcon={(
              <LockOpenIcon
                titleAccess="admin-delete"
              />
            )}
            disabled={!!source.url_search_string}
          >
            Create New Alternative Domain
          </Button>
          <Dialog
            open={openNewAlternativeDomain}
            onClose={() => setOpenNewAlternativeDomain(false)}
          >
            <DialogTitle>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              Add an Alternative Domain for {source.name}, this should be the canonical domain and should not be a source already.
              {' '}

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
              <Button onClick={() => handleAddAlternativeDomain()}>Confirm</Button>
            </DialogActions>
          </Dialog>

        </PermissionedContributor>
      </ControlBar>
      <Outlet />
    </>
  );
}
