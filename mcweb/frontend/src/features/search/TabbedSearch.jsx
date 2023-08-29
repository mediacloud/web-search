import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopy from '@mui/icons-material/ContentCopy';
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';
import LoadSavedSearches from './query/savedsearch/LoadSavedSearches';
import SaveSearch from './query/savedsearch/SaveSearch';
import TabDropDownMenu from '../ui/TabDropDownMenu';
import {
  addQuery, setLastSearchTime, removeQuery, setQueryProperty,
} from './query/querySlice';
import Search from './query/Search';
import PlatformPicker from './query/PlatformPicker';
import AlertDialog from '../ui/AlertDialog';
import CountOverTimeResults from './results/CountOverTimeResults';
import TotalAttentionResults from './results/TotalAttentionResults';
import TopWords from './results/TopWords';
import TopLanguages from './results/TopLanguages';
import SampleStories from './results/SampleStories';
import TabPanelHelper from '../ui/TabPanelHelper';
import { searchApi } from '../../app/services/searchApi';
import deactivateButton from './util/deactivateButton';
import urlSerializer from './util/urlSerializer';
import isNumber from './util/isNumber';
import tabTitle from './util/tabTitles';
import { useListCollectionsFromNestedArrayMutation } from '../../app/services/collectionsApi';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function TabbedSearch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [value, setValue] = useState(0); // index of tab
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const queryState = useSelector((state) => state.query);
  const [color, setColor] = useState(['white']); // colors of tabs, we don't need to save this in state
  const [edit, setEdit] = useState([false]); // local state variable for
  const [textFieldsValues, setTextFieldValues] = useState(queryState.map((query) => query.name));
  const { platform, advanced } = queryState[0];

  const [getCollectionNames] = useListCollectionsFromNestedArrayMutation();

  useEffect(() => {
    setShow(deactivateButton(queryState));
    setTextFieldValues(queryState.map((query) => query.name));
  }, [queryState, edit]);

  const handleShare = () => {
    const ahref = `search.mediacloud.org/search?${urlSerializer(queryState)}`;
    navigator.clipboard.writeText(ahref);
  };

  const fetchCollectionNames = async () => {
    const collectionIds = queryState.map((query) => query.collections);
    const nestedArrayOfCollectionData = await getCollectionNames(collectionIds).unwrap();
    return nestedArrayOfCollectionData.collection;
  };

  const handleChange = (event, newValue) => {
    // in the odd coincidence that an object or non number is passed in
    if (isNumber(newValue)) {
      setValue(newValue);
    }
  };

  const handleAddQuery = () => {
    const qsLength = queryState.length;

    setColor(() => [...color, 'White']);
    setEdit(() => [...edit, false]);
    dispatch(addQuery({ platform, advanced }));
    dispatch(setQueryProperty(
      {
        name: `Query ${queryState.length + 1}`,
        queryIndex: queryState.length,
        property: 'name',
      },
    ));

    setValue(qsLength);
  };

  const handleRemoveQuery = async (index) => {
    const updatedColor = color.filter((_, i) => i !== index);
    const updatedEdit = edit.filter((_, i) => i !== index);

    setColor(updatedColor);
    setEdit(updatedEdit);
    dispatch(removeQuery(index));
    // Adjust tab name to sync with index
    queryState.forEach((query, i) => {
      if (i !== index && i > index && query.name === `Query ${i + 1}`) {
        dispatch(setQueryProperty({ name: `Query ${i}`, queryIndex: i - 1, property: 'name' }));
      }
    });

    setValue(index === 0 ? 0 : index - 1);
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (index, colorValue) => {
    // SyntheticBaseEvent (click outside of menu)
    if (isNumber(index)) {
      setValue(index);
    }
    if (colorValue === 'edit') {
      const updatedEdit = [...edit];
      updatedEdit[index] = true;
      setEdit(updatedEdit);
    } else {
      const newColors = [...color];
      newColors[index] = colorValue;
      setColor(newColors);
    }
    setAnchorEl(null);
  };

  return (
    <div className="container search-container">
      <PlatformPicker queryIndex={0} sx={{ paddingTop: 50 }} />
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginLeft: 6 }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            {queryState.map((query, i) => (
              <Tab
                disableRipple
                key={query.queryIndex}
                sx={{ marginRight: 0.5 }}
                style={{ outline: `4px solid ${color[i]}`, outlineOffset: '-4px', borderRadius: '4px' }}
                label={(
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Title */}
                    <div>
                      {!edit[i] && queryState[i].name}
                      {edit[i] && (
                        <div>
                          {/* input for customizing tab title */}
                          <input
                            className="editInput"
                            value={textFieldsValues[i]}
                            type="text"
                            onChange={(event) => {
                              const updatedValues = [...textFieldsValues];
                              updatedValues[value] = event.target.value;
                              setTextFieldValues(updatedValues);
                            }}
                          />
                          {/* Cancel Edit */}
                          <CancelIcon
                            sx={{ color: '#d24527', marginLeft: '.5rem' }}
                            onClick={() => {
                              const updatedEdit = [...edit];
                              updatedEdit[value] = false;
                              setEdit(updatedEdit);
                            }}
                          />

                          {/* Confirm Edit */}
                          <CheckIcon
                            disabled={textFieldsValues[i].length === 0}
                            sx={{ color: '#d24527', marginLeft: '.5rem' }}
                            onClick={() => {
                              const updatedEdit = [...edit];
                              updatedEdit[value] = false;
                              setEdit(updatedEdit);
                              dispatch(setQueryProperty({ name: textFieldsValues[i], queryIndex: value, property: 'name' }));
                              dispatch(setQueryProperty({ edited: true, queryIndex: value, property: 'edited' }));
                            }}
                          />
                        </div>
                      )}

                      {/* Remove Icon: display if length of queryState > 1 and edit === false  */}
                      {(queryState.length > 1 && !edit[i]) && (
                        <RemoveCircleOutlineIcon
                          sx={{
                            color: '#d24527', marginLeft: '.5rem',
                          }}
                          onClick={() => handleRemoveQuery(i)}
                          variant="contained"
                        />
                      )}
                    </div>

                    {/* Dropdown Menu */}
                    <TabDropDownMenu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl) && value === i}
                      handleClose={(colorValue) => handleClose(i, colorValue)}
                      handleEdit={() => {
                        const updatedEdit = [...edit];
                        updatedEdit[i] = true;
                        setEdit(updatedEdit);
                      }}
                      handleMenuOpen={handleMenuOpen}
                    />
                  </Box>
                )}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...a11yProps(i)}
              />
            ))}
            <Tab label="+ Add Query" onClick={handleAddQuery} />
          </Tabs>
        </Box>

        {queryState.map((query, i) => (
          <TabPanelHelper key={query.queryIndex} value={value} index={i}>
            <Search queryIndex={i} />
          </TabPanelHelper>
        ))}
      </Box>

      <div className="search-button-wrapper">

        <div className="container">
          <div className="row">
            <div className="col-2">
              <AlertDialog
                openDialog={open}
                outsideTitle="Share Search"
                title="Share this Search"
                content={<code>{`search.mediacloud.org/search?${urlSerializer(queryState)}`}</code>}
                action={handleShare}
                actionTarget
                snackbar
                snackbarText="Search copied to clipboard!"
                dispatchNeeded={false}
                onClick={() => setOpen(true)}
                variant="outlined"
                startIcon={<ContentCopy titleAccess="copy this search" />}
                secondAction={false}
                className="float-end"
                confirmButtonText="copy"
              />
            </div>

            <div className="col-7">
              <LoadSavedSearches />
            </div>

            <div className="col-2">
              <SaveSearch />
            </div>

            <div className="col-1">
              <Button
                className="float-end"
                variant="contained"
                disabled={!show}
                startIcon={<SearchIcon titleAccess="search this query" />}
                onClick={async () => {
                  dispatch(searchApi.util.resetApiState());
                  dispatch(setLastSearchTime(dayjs().unix()));
                  const collectionNames = await fetchCollectionNames();
                  const updatedQueryState = JSON.parse(JSON.stringify(queryState));
                  queryState.forEach((q, i) => {
                    if (!queryState[i].edited) {
                      // eslint-disable-next-line max-len
                      const newName = tabTitle(q.queryList, q.negatedQueryList, q.anyAll, q.queryString, collectionNames, i, queryState);
                      updatedQueryState[i].name = newName;
                      dispatch(
                        setQueryProperty({
                          name: newName,
                          queryIndex: i,
                          property: 'name',
                        }),
                      );
                    }
                  });
                  navigate(`/search?${urlSerializer(updatedQueryState)}`, {
                    options: { replace: true },
                  });
                }}
              >
                Search
              </Button>
            </div>
          </div>
        </div>

      </div>
      <div className="search-results-wrapper">
        <div className="container">
          <CountOverTimeResults />
          <TotalAttentionResults />
          <SampleStories />
          <TopWords />
          <TopLanguages />
        </div>
      </div>
    </div>
  );
}
