import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Settings } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import CountOverTimeChart from './CountOverTimeChart';
import { useGetCountOverTimeMutation } from '../../../app/services/searchApi';
import { supportsNormalizedCount } from './TotalAttentionResults';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import prepareCountOverTimeData from '../util/prepareCountOverTimeData';

export default function CountOverTimeResults() {
  const queryState = useSelector((state) => state.query);

  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  const [normalized, setNormalized] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const [dispatchQuery, { isLoading, data, error }] = useGetCountOverTimeMutation();

  const handleDownloadRequest = (qs) => {
    window.location = `/api/search/download-counts-over-time-csv?qS=${encodeURIComponent(JSON.stringify(prepareQueries(qs)))}`;
  };

  const myRef = useRef(null);
  const executeScroll = () => myRef.current.scrollIntoView();
  const [newQuery, setNewQuery] = useState(false);

  useEffect(() => {
    if (!checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
      setNormalized(supportsNormalizedCount(platform));
    }
  }, [lastSearchTime]);

  useEffect(() => {
    if (checkForBlankQuery(queryState) && queryState.length === 1) {
      setNewQuery(true);
    } else {
      setNewQuery(false);
    }
  }, [lastSearchTime, queryState.length]);

  useEffect(() => {
    if ((data)) {
      if ((data.count_over_time.length === queryState.length)) { executeScroll(); }
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
        {error.data.note}
        )
      </Alert>
    );
  } else {
    console.log('DATA', data);
    const preparedData = prepareCountOverTimeData(data, normalized, queryState);
    console.log('PREPAREDDATA', preparedData);
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
                  <Button onClick={handleClick} startIcon={<Settings titleAccess="view other chart viewing options" />}>
                    View Options
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
                  </Menu>
                </div>
              )}
              {!normalized && (
                <div>
                  <Button onClick={handleClick}>
                    View Options
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
                  </Menu>
                </div>
              )}
            </div>
          )}
          <div className="float-end">
            <Button
              variant="text"
              startIcon={<DownloadIcon titleAccess="download attention over time results" />}
              onClick={() => {
                handleDownloadRequest(queryState);
              }}
            >
              Download CSV
            </Button>
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
