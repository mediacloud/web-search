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
import TabDropDownMenu from '../ui/TabDropDownMenu';
import {
  addQuery, setInitialSearchTime, removeQuery, setQueryProperty, addComparativeQuery,
} from './query/querySlice';
import Search from './query/Search';
import PlatformPicker from './query/PlatformPicker';
import AlertDialog from '../ui/AlertDialog';
import CountOverTimeResults from './results/CountOverTimeResults';
import TotalAttentionResults from './results/TotalAttentionResults';
import TopWords from './results/TopWords';
import TopLanguages from './results/TopLanguages';
import SampleStories from './results/SampleStories';
import TopSources from './results/TopSources';
import TabPanelHelper from '../ui/TabPanelHelper';
import { searchApi } from '../../app/services/searchApi';
import { PARTISAN, GLOBAL } from './util/generateComparativeQuery';
import deactivateButton from './util/deactivateButton';
import urlSerializer from './util/urlSerializer';
import isNumber from './util/isNumber';
import tabTitle from './util/tabTitles';
import { useLazyListCollectionsFromNestedArrayQuery } from '../../app/services/collectionsApi';

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

  const [getCollectionNames] = useLazyListCollectionsFromNestedArrayQuery();

  useEffect(() => {
    setShow(deactivateButton(queryState));
    setTextFieldValues(queryState.map((query) => query.name));
  }, [queryState, edit]);

  useEffect(() => {
    document.title = 'Media Cloud Search';
  });

  const handleShare = () => {
    const ahref = `search.mediacloud.org/search?${urlSerializer(queryState)}`;
    navigator.clipboard.writeText(ahref);
  };

  const prepareCollectionIds = (collectionIds) => {
    const queries = {};
    collectionIds.forEach((query, i) => {
      queries[i] = query;
    });
    return queries;
  };

  const fetchCollectionNames = async () => {
    const collectionIds = queryState.map((query) => query.collections);
    const prepareCollections = prepareCollectionIds(collectionIds);
    const nestedArrayOfCollectionData = await getCollectionNames(prepareCollections).unwrap();
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

  const handleComparative = (i, type) => {
    if (type === PARTISAN) {
      dispatch(addComparativeQuery({ type: PARTISAN, query: queryState[i] }));
    }
    if (type === GLOBAL) {
      dispatch(addComparativeQuery({ type: GLOBAL, query: queryState[i] }));
    }
    setAnchorEl(null);
  };

  return (
    <div className="container search-container">
      <br />
      <PlatformPicker queryIndex={0} sx={{ paddingTop: 50 }} />
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginLeft: 6 }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="query tabs"
          >
            {queryState.map((query, i) => (
              <Tab
                disableRipple
                // eslint-disable-next-line react/no-array-index-key
                key={i}
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
                      handleComparative={(type) => handleComparative(i, type)}
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
          // eslint-disable-next-line react/no-array-index-key
          <TabPanelHelper key={i} value={value} index={i}>
            <Search queryIndex={i} />
          </TabPanelHelper>
        ))}
      </Box>

      <div className="search-button-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-11">
              <AlertDialog
                openDialog={open}
                outsideTitle="Share this Search"
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

            <div className="col-1">
              <Button
                className="float-end"
                variant="contained"
                disabled={!show}
                startIcon={<SearchIcon titleAccess="search this query" />}
                onClick={async () => {
                  dispatch(searchApi.util.resetApiState());
                  dispatch(setInitialSearchTime(dayjs().unix()));
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
          <TopLanguages />
          <TopSources />
          <TopWords />
        </div>
      </div>
    </div>
  );
}
