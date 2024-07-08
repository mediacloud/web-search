import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Settings from '@mui/icons-material/Settings';
import CSVDialog from './CSVDialog';
import { AOT } from '../util/getDownloadUrl';
import CountOverTimeChart from './CountOverTimeChart';
import { useGetCountOverTimeMutation } from '../../../app/services/searchApi';
import { setLastSearchTime } from '../query/querySlice';
import { supportsNormalizedCount } from './TotalAttentionResults';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import {
  prepareCountOverTimeData, DAY, WEEK, MONTH,
} from '../util/prepareCountOverTimeData';

export default function CountOverTimeResults() {
  const dispatch = useDispatch();
  const queryState = useSelector((state) => state.query);

  const {
    platform,
    initialSearchTime,
  } = queryState[0];

  const [normalized, setNormalized] = useState(true);

  const [chartBy, setChartBy] = useState(DAY);

  const [anchorEl, setAnchorEl] = useState(null);

  const [openDownloadDialog, setopenDownloadDialog] = useState(false);

  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const [dispatchQuery, { isLoading, data, error }] = useGetCountOverTimeMutation();

  const myRef = useRef(null);
  const executeScroll = () => myRef.current.scrollIntoView();
  const [newQuery, setNewQuery] = useState(false);

  useEffect(() => {
    if (!checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
      setNormalized(supportsNormalizedCount(platform));
    }
  }, [initialSearchTime]);

  useEffect(() => {
    if (checkForBlankQuery(queryState) && queryState.length === 1) {
      setNewQuery(true);
    } else {
      setNewQuery(false);
    }
  }, [initialSearchTime, queryState.length]);

  useEffect(() => {
    if ((data)) {
      if ((data.length === queryState.length)) { executeScroll(); }
      dispatch(setLastSearchTime(dayjs().unix()));
    } else if (error) {
      executeScroll();
    }
  }, [data, error]);

  if (newQuery) return null;

  let content;

  if (isLoading) {
    return (<div><CircularProgress size="75px" /></div>);
  }

  if (!data && !error) return null;
  if (error) {
    // const msg = data.note;
    content = (
      <Alert severity="warning">
        Sorry, but something went wrong.
        (
        {error.note}
        )
      </Alert>
    );
  } else {
    const preparedData = prepareCountOverTimeData(data, normalized, chartBy);
    if (preparedData.length !== queryState.length) return null;
    const updatedPrepareCountOverTimeData = preparedData.map(
      (originalDataObj, index) => {
        const queryTitleForPreparation = { name: queryState[index].name };
        return { ...queryTitleForPreparation, ...originalDataObj };
      },
    );
    content = (
      <>
        <CountOverTimeChart
          series={updatedPrepareCountOverTimeData}
          normalized={normalized}
        />
        <div className="clearfix">
          {supportsNormalizedCount(platform) && (
            <div className="float-start">
              {normalized && (
                <div>
                  <Button
                    onClick={handleClick}
                    variant="outlined"
                    startIcon={<Settings titleAccess="view other chart viewing options" />}
                  >
                    View Options...
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button',
                    }}
                  >
                    <MenuItem onClick={() => {
                      setNormalized(false);
                      handleClose();
                    }}
                    >
                      View Content Count
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => {
                      setChartBy(DAY);
                    }}
                    >
                      Chart by day
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setChartBy(WEEK);
                    }}
                    >
                      Chart by week
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setChartBy(MONTH);
                    }}
                    >
                      Chart by month
                    </MenuItem>
                  </Menu>
                </div>
              )}
              {!normalized && (
                <div>
                  <Button variant="outlined" onClick={handleClick}>
                    View Options...
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button',
                    }}
                  >
                    <MenuItem onClick={() => {
                      setNormalized(true);
                      handleClose();
                    }}
                    >
                      View Normalized Content Percentage (default)
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => {
                      setChartBy(DAY);
                    }}
                    >
                      Chart by day
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setChartBy(WEEK);
                    }}
                    >
                      Chart by week
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setChartBy(MONTH);
                    }}
                    >
                      Chart by month
                    </MenuItem>
                  </Menu>
                </div>
              )}
            </div>
          )}
          <div className="float-end">
            <CSVDialog
              openDialog={openDownloadDialog}
              queryState={queryState}
              downloadType={AOT}
              outsideTitle="Download CSV of Attention Over Time"
              title="Choose a Query to Download a Attention Over Time CSV or you can choose to download all queries"
              snackbar
              snackbarText="Attention Over Time CSV Downloading"
              onClick={() => setopenDownloadDialog(true)}
              variant="outlined"
            />
          </div>
        </div>
      </>
    );
  }
  return (
    <div ref={myRef} className="results-item-wrapper clearfix">
      <div className="row">
        <div className="col-4">
          <h2>Attention Over Time</h2>
          <p>
            Compare the attention paid to your queries over time to understand how they are covered.
            This chart shows the number of stories that match each of your queries. Spikes in
            attention can reveal key events. Plateaus can reveal stable, &quot;normal&quot;
            attention levels. Use the &quot;view options&quot; menu to switch between story counts
            and a percentage (if supported).
          </p>
        </div>
        <div className="col-8">
          {content}
        </div>
      </div>
    </div>
  );
}
