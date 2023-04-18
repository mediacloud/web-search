import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Settings } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import queryGenerator from '../util/queryGenerator';
import CountOverTimeChart from './CountOverTimeChart';
import { useGetCountOverTimeMutation } from '../../../app/services/searchApi';
import { supportsNormalizedCount } from './TotalAttentionResults';

export default function CountOverTimeResults() {
  const {
    queryList,
    queryString,
    negatedQueryList,
    platform,
    startDate,
    endDate,
    collections,
    sources,
    lastSearchTime,
    anyAll,
    advanced,
  } = useSelector((state) => state.query);

  const [normalized, setNormalized] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const fullQuery = () => {
    let queryReturn = '';
    if (queryString) {
      queryReturn = queryString;
    } else {
      queryReturn = queryGenerator(queryList, negatedQueryList, platform, anyAll);
    }
    return queryReturn;
  };

  const [query, { isLoading, data, error }] = useGetCountOverTimeMutation();

  const collectionIds = collections.map((c) => c.id);
  const sourceIds = sources.map((s) => s.id);

  const handleDownloadRequest = (queryObject) => {
    window.location = `/api/search/download-counts-over-time-csv?queryObject=${encodeURIComponent(JSON.stringify(queryObject))}`;
  };

  const dateHelper = (dateString) => {
    dayjs.extend(utc);
    const newDate = dayjs(dateString, 'YYYY-MM-DD').valueOf();
    return newDate;
  };

  const cleanData = (oldData) => oldData.map((r) => [
    dateHelper(r.date),
    normalized ? r.ratio * 100 : r.count,
  ]);

  const myRef = useRef(null);
  const executeScroll = () => myRef.current.scrollIntoView();

  useEffect(() => {
    if (queryList[0].length !== 0 || (advanced && queryString !== 0)) {
      query({
        query: fullQuery(),
        startDate,
        endDate,
        collections: collectionIds,
        sources: sourceIds,
        platform,
      });
      setNormalized(supportsNormalizedCount(platform));
    }
  }, [lastSearchTime]);

  useEffect(() => {
    if (data || error) {
      executeScroll();
    }
  }, [data, error]);

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
    content = (
      <>
        <CountOverTimeChart
          data={cleanData(data.count_over_time.counts)}
          normalized={normalized}
        />
        <div className="clearfix">
          {supportsNormalizedCount(platform) && (
            <div className="float-start">
              {normalized && (
                <div>
                  <Button onClick={handleClick} endIcon={<Settings titleAccess="view other chart viewing options" />}>
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
              endIcon={<DownloadIcon titleAccess="download attention over time results" />}
              onClick={() => {
                handleDownloadRequest({
                  query: fullQuery(),
                  startDate,
                  endDate,
                  collections: collectionIds,
                  sources: sourceIds,
                  platform,
                });
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
          { content }
        </div>
      </div>
    </div>
  );
}
