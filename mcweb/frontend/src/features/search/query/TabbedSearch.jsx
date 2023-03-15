import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { addQuery, setLastSearchTime } from './querySlice';
import Search from '../Search';
import PlatformPicker from './PlatformPicker';
import CountOverTimeResults from '../results/CountOverTimeResults';
import TotalAttentionResults from '../results/TotalAttentionResults';
// import urlSerializer from '../util/urlSerializer';
import { searchApi } from '../../../app/services/searchApi';
import deactivateButton from '../util/deactivateButton';

export default function TabbedSearch() {
  const dispatch = useDispatch();
  const [value, setValue] = useState(0);
  const [show, setShow] = useState(true);

  const queryState = useSelector((state) => state.query);
  const { platform } = queryState[0];
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleAddQuery = () => {
    const qsLength = queryState.length;
    dispatch(addQuery(platform));
    setValue(qsLength);
  };

  useEffect(() => {
    setValue(0);
  }, [platform]);

  // useEffect(() => {
  //   setShow(deactivateButton(queryState));
  // }, [queryState]);

  return (
    <div className="container search-container">
      <PlatformPicker queryIndex={0} sx={{ paddingTop: 50 }} />
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            {queryState.map((query, i) => (
              <Tab label={`Query ${i + 1}`} {...a11yProps(i)} />
            ))}
            <Tab label="+ Add Query" onClick={handleAddQuery} />
          </Tabs>
        </Box>

        {queryState.map((query, i) => (
          <TabPanel value={value} index={i}>
            <Search queryIndex={i} />
          </TabPanel>
        ))}
      </Box>

      <div className="search-button-wrapper">
        <div className="container">
          <div className="row">

            {/* <div className="col-11">
              <AlertDialog
                openDialog={open}
                outsideTitle="Share this Search"
                title="Share this Search"
                content={<code>{`search.mediacloud.org/search${urlSerializer(queryState)}`}</code>}
                action={handleShare}
                actionTarget
                snackbar
                snackbarText="Search copied to clipboard!"
                dispatchNeeded={false}
                onClick={() => setOpen(true)}
                variant="outlined"
                endIcon={<ContentCopy titleAccess="copy this search" />}
                secondAction={false}
                className="float-end"
                confirmButtonText="copy"
              />
            </div> */}

            <div className="col-1">
              {/* Submit */}
              <Button
                className="float-end"
                variant="contained"
                // disabled={!show}
                endIcon={<SearchIcon titleAccess="search this query" />}
                onClick={() => {
                  // navigate(
                  //   `/search${urlSerializer(queryState)}`,
                  //   { options: { replace: true } },
                  // );
                  dispatch(searchApi.util.resetApiState());
                  dispatch(setLastSearchTime(dayjs().unix()));
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
          {/* <SampleStories /> */}
          {/* <TopWords /> */}
          {/* <TopLanguages /> */}
        </div>
      </div>

    </div>
  );
}

function TabPanel(props) {
  const {
    children, value, index, ...other
  } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
      <Box sx={{ p: 3 }}>
        <Typography>{children}</Typography>
      </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

TabPanel.defaultProps = {
  children: null,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
