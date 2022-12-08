import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';
import { useLazyListCollectionsQuery } from '../../app/services/collectionsApi';
import { useLazyListSourcesQuery } from '../../app/services/sourceApi';
import { platformDisplayName } from '../ui/uiUtil';
import { useNavigate } from 'react-router-dom';

const MIN_QUERY_LEN = 2;
const MAX_RESULTS = 5;  // per endpoint
const MIN_POLL_MILLISECS = 500;
const MAX_MATCH_DISPLAY_LEN = 50;

// @see https://mui.com/material-ui/react-autocomplete/#load-on-open
export default function DirectorySearch() {
    const [lastRequestTime, setLastRequestTime] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState([]);
    const [searchStr, setSearchStr] = React.useState('');
    const navigate = useNavigate();
    const [collectionTrigger, {
        isFetching: isCollectonSearchFetching, data: collectionSearchResults,
      }] = useLazyListCollectionsQuery();
    const [sourceTrigger, {
        isFetching: isSourceSearchFetching, data: sourceSearchResults,
    }] = useLazyListSourcesQuery();
    
    // handle collection search results  
    useEffect(() => {
        let active = true;
        if (!isCollectonSearchFetching) {
            return undefined;
        }
        if (active && collectionSearchResults) {
            const existingOptionIds = options.filter(o => o.type == 'collection').map(o => o.id);
            const newOptions = collectionSearchResults.results.filter(c => !existingOptionIds.includes(c.id));
            setOptions([...options, ...newOptions.slice(0,MAX_RESULTS).map(c => ({
                type: 'collection',
                id: c.id,
                value: c.id,
                label: `Collection: ${c.name.substring(0, MAX_MATCH_DISPLAY_LEN)} (${platformDisplayName(c.platform)})`
            }))]);
        }
        return () => {
            active = false;
        };
    }, [isCollectonSearchFetching]);


    // handle source search results  
    useEffect(() => {
        let active = true;
        if (!isSourceSearchFetching) {
            return undefined;
        }
        if (active && sourceSearchResults) {
            const existingOptionIds = options.filter(o => o.type == 'source').map(o => o.id);
            const newOptions = sourceSearchResults.results.filter(s => !existingOptionIds.includes(s.id));
            setOptions([...options, ...newOptions.slice(0,MAX_RESULTS).map(s => ({
                type: 'source',
                id: s.id,
                value: s.id,
                label: `Source: ${(s.label || s.name).substring(0, MAX_MATCH_DISPLAY_LEN)} (${platformDisplayName(s.platform)})`
            }))]);
        }
        return () => {
            active = false;
        };
    }, [isSourceSearchFetching]);

    const somethingIsFetching = isCollectonSearchFetching || isSourceSearchFetching;

    useEffect(() => {
        if (!open) {
          setOptions([]);
        }
    }, [open]);

    return (
        <Autocomplete
            id="quick-directory-search"
            open={open}
            filterOptions={(x) => x} /* let the server filter optons */
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.label}
            noOptionsText="No matches"
            options={options}
            loading={somethingIsFetching}
            onChange={(e, value) => {   /** called when an option is clicked */
                if (value.type=="collection") {
                    navigate(`/collections/${value.id}`);
                }
                if (value.type=="source") {
                    navigate(`/sources/${value.id}`);
                }
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search for Collections or Sources"
                    InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <React.Fragment>
                        {somethingIsFetching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                        </React.Fragment>
                    ),
                    }}
                    onChange={({target: {value}}) => {
                        setOptions([]);
                        // only search if str is long enough, and if we haven't searched recently
                        if ((value.length > MIN_QUERY_LEN) && (Date.now() > (lastRequestTime + MIN_POLL_MILLISECS))) {
                            setLastRequestTime(Date.now());
                            collectionTrigger({name: value});
                            sourceTrigger({name: value});
                        }
                    }}
                />
            )}
        />
    );
}
