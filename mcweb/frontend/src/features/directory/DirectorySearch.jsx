import PropTypes from 'prop-types';
import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyListCollectionsQuery } from '../../app/services/collectionsApi';
import { useLazyListSourcesQuery } from '../../app/services/sourceApi';
import { trimStringForDisplay } from '../ui/uiUtil';

const MIN_QUERY_LEN = 2; // don't query for super short things
const MAX_MATCH_DISPLAY_LEN = 50; // make sure labels are too long

// @see https://mui.com/material-ui/react-autocomplete/#load-on-open
export default function DirectorySearch({ onSelected, searchSources }) {
  const [open, setOpen] = React.useState(false);
  const [collectionOptions, setCollectionOptions] = React.useState([]);
  const [sourceOptions, setSourceOptions] = React.useState([]);
  const navigate = useNavigate();
  const [collectionTrigger, {
    isFetching: isCollectonSearchFetching, data: collectionSearchResults,
  }] = useLazyListCollectionsQuery();
  const [sourceTrigger, {
    isFetching: isSourceSearchFetching, data: sourceSearchResults,
  }] = useLazyListSourcesQuery();

  // handle collection search results
  useEffect(() => {
    if (collectionSearchResults) {
      const existingOptionIds = collectionOptions.filter((o) => o.type === 'collection').map((o) => o.id);
      const newOptions = collectionSearchResults.results.filter((c) => !existingOptionIds.includes(c.id));
      setCollectionOptions(newOptions.slice(0, collectionSearchResults.length).map((c) => ({
        displayGroup: 'Collections',
        type: 'collection',
        id: c.id,
        value: c.id,
        label: `${trimStringForDisplay(c.name, MAX_MATCH_DISPLAY_LEN)}`,
      })));
    }
  }, [collectionSearchResults]);

  // handle source search results
  useEffect(() => {
    if (sourceSearchResults) {
      const existingOptionIds = sourceOptions.filter((o) => o.type === 'source').map((o) => o.id);
      const newOptions = sourceSearchResults.results.filter((s) => !existingOptionIds.includes(s.id));
      setSourceOptions(newOptions.slice(0, sourceSearchResults.length).map((s) => ({
        displayGroup: 'Sources',
        type: 'source',
        id: s.id,
        value: s.id,
        label: `${trimStringForDisplay(s.label || s.name, MAX_MATCH_DISPLAY_LEN)}`,
      })));
    }
  }, [sourceSearchResults]);

  const somethingIsFetching = isCollectonSearchFetching || isSourceSearchFetching;

  useEffect(() => {
    if (!open) {
      setSourceOptions([]);
      setCollectionOptions([]);
    }
  }, [open]);

  const defaultSelectionHandler = (e, value) => {
    if (value.type === 'collection') {
      navigate(`/collections/${value.id}`);
    }
    if (value.type === 'source') {
      navigate(`/sources/${value.id}`);
    }
  };

  return (
    <Autocomplete
      id="quick-directory-search"
      open={open}
      filterOptions={(x) => x} /* let the server filter optons */
      onOpen={() => {

      }}
      onClose={() => {
        setOpen(false);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.label}
      noOptionsText="No matches"
      groupBy={(option) => option.displayGroup}
      options={[...collectionOptions, ...sourceOptions]}
      loading={somethingIsFetching}
      onChange={onSelected || defaultSelectionHandler}
      renderInput={(params) => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          label={searchSources ? 'Search for Collections or Sources' : 'Search for Collections'}
          disabled={somethingIsFetching}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {somethingIsFetching ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          onKeyUp={(event) => {
            if (event.key === 'Enter') {
              const { value } = event.target;
              setOpen(true);
              setSourceOptions([]);
              setCollectionOptions([]);
              // only search if str is long enough
              if (value.length > MIN_QUERY_LEN) {
                if (searchSources) {
                  sourceTrigger({ name: value.trim() });
                }
                collectionTrigger({ name: value.trim() });
              }
            }
          }}
        />
      )}
    />
  );
}

DirectorySearch.propTypes = {
  searchCollections: PropTypes.bool,
  searchSources: PropTypes.bool,
  onSelected: PropTypes.func,

};

DirectorySearch.defaultProps = {
  searchCollections: true,
  searchSources: true,
  onSelected: null,
};
