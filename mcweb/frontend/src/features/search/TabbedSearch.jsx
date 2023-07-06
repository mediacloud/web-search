import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopy from '@mui/icons-material/ContentCopy';
import dayjs from 'dayjs';
import LoadSavedSearches from './query/savedsearch/LoadSavedSearches';
import SaveSearch from './query/savedsearch/SaveSearch';
import { addQuery, setLastSearchTime, removeQuery } from './query/querySlice';
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
import tabTitle from './util/tabTitle';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function TabbedSearch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  const queryState = useSelector((state) => state.query);

  const [color, setColors] = useState(['White']);

  const { platform } = queryState[0];

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleAddQuery = () => {
    const qsLength = queryState.length;
    setColors(() => [...color, 'White']);
    dispatch(addQuery(platform));
    setValue(qsLength);
  };

  const handleRemoveQuery = (index) => {
    const newColorArray = [];

    for (let i = 0; i < color.length; i += 1) {
      if (i !== index) {
        newColorArray.push(color[i]);
      }
    }

    setColors(newColorArray);
    dispatch(removeQuery(index));

    if (index === 0) {
      setValue(0);
    } else {
      setValue(index - 1);
    }
  };

  const handleShare = () => {
    const ahref = `search.mediacloud.org/search?${urlSerializer(queryState)}`;
    navigator.clipboard.writeText(ahref);
  };

  useEffect(() => {
    setValue(0);
  }, [platform]);

  useEffect(() => {
    setShow(deactivateButton(queryState));
  }, [queryState]);

  const [anchorEl, setAnchorEl] = useState(false);

  const handleClose = (index, colorValue) => {
    setValue(index);
    const newColors = [...color];
    newColors[index] = colorValue;
    setColors(newColors);
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
                key={`${tabTitle(queryState, i)}`}
                onContextMenu={
                  (event) => {
                    setValue(i);
                    event.preventDefault();
                    setAnchorEl(event.currentTarget);
                  }
                }
                sx={{ marginRight: 0.5 }}
                style={{
                  outline: `4px solid ${color[i]}`, // change the color and size as needed
                  outlineOffset: '-4px', // adjust this value to match the size of the outline
                }}
                label={(
                  <div className="tabTitleLabel">

                    {tabTitle(queryState, i)}

                    <Menu anchorEl={anchorEl} open={anchorEl} onClose={handleClose}>
                      <MenuItem onClick={() => handleClose(value, 'orange')}>Orange</MenuItem>
                      <MenuItem onClick={() => handleClose(value, 'yellow')}>Yellow</MenuItem>
                      <MenuItem onClick={() => handleClose(value, 'green')}>Green</MenuItem>
                      <MenuItem onClick={() => handleClose(value, 'blue')}>Blue</MenuItem>
                      <MenuItem onClick={() => handleClose(value, 'indigo')}>Indigo</MenuItem>
                    </Menu>

                    {!(i === 0 && queryState.length - 1 === 0) && (
                      <RemoveCircleOutlineIcon
                        sx={{ color: '#d24527', marginLeft: '.5rem' }}
                        onClick={() => handleRemoveQuery(i)}
                        variant="contained"
                      />
                    )}
                  </div>
                )}
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...a11yProps(i)}
              />
            ))}
            <Tab label="+ Add Query" onClick={handleAddQuery} />
          </Tabs>
        </Box>

        {queryState.map((query, i) => (
          <TabPanelHelper key={`${query}`} value={value} index={i}>
            <Search queryIndex={i} />
          </TabPanelHelper>
        ))}
      </Box>

      <div className="search-button-wrapper">

        <div className="start-buttons">
          <div>
            <AlertDialog
              openDialog={open}
              outsideTitle={<ContentCopy titleAccess="copy this search" />}
              title="Share this Search"
              content={<code>{`search.mediacloud.org/search?${urlSerializer(queryState)}`}</code>}
              action={handleShare}
              actionTarget
              snackbar
              snackbarText="Search copied to clipboard!"
              dispatchNeeded={false}
              onClick={() => setOpen(true)}
              variant="outlined"
              endIcon={<MoreVertIcon titleAccess="copy this search" />}
              secondAction={false}
              confirmButtonText="copy"
            />
          </div>
          <div>
            <LoadSavedSearches />
          </div>
        </div>

        <div className="end-buttons">
          <div>
            <SaveSearch />
          </div>
          <div>
            <Button
              variant="contained"
              disabled={!show}
              endIcon={<SearchIcon titleAccess="search this query" />}
              onClick={() => {
                navigate(`/search?${urlSerializer(queryState)}`, { options: { replace: true } });
                dispatch(searchApi.util.resetApiState());
                dispatch(setLastSearchTime(dayjs().unix()));
              }}
            >
              Search
            </Button>
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
