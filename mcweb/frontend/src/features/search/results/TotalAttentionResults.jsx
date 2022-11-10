import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TotalAttentionChart from './TotalAttentionChart';
import queryGenerator from '../util/queryGenerator';
import { useGetTotalCountMutation, useGetNormalizedCountOverTimeMutation } from '../../../app/services/searchApi';
import { PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE } from '../util/platforms';

function TotalAttentionResults() {
  const {
    queryString,
    queryList,
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

  const fullQuery = queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const [normalized, setNormalized] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const [query, { isLoading, data, error }] = useGetTotalCountMutation();

  const [normalizedQuery, nqResult] = useGetNormalizedCountOverTimeMutation();

  const collectionIds = collections.map((collection) => collection.id);

  const normalizeData = (oldData) => {
    let newData;
    if (platform === PROVIDER_NEWS_MEDIA_CLOUD || platform === PROVIDER_NEWS_WAYBACK_MACHINE) {
      const { total } = oldData;
      const normalizedTotal = oldData.normalized_total;
      if (normalized) {
        newData = (total / normalizedTotal);
      } else {
        newData = total;
      }
    } else {
      newData = oldData.count;
    }
    return newData;
  };

  useEffect(() => {
    if ((queryList[0].length !== 0 || (advanced && queryString !== 0))
      && (platform === PROVIDER_NEWS_MEDIA_CLOUD
      || platform === PROVIDER_NEWS_WAYBACK_MACHINE)) {
      normalizedQuery({
        query: fullQuery,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,
      });
      setNormalized(true);
    } else if ((queryList[0].length !== 0) || (advanced && queryString !== 0)) {
      query({
        query: fullQuery,
        startDate,
        endDate,
        collections: collectionIds,
        sources,
        platform,

      });
      setNormalized(false);
    }
  }, [lastSearchTime]);

  if (isLoading || nqResult.isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  if (!data && !nqResult.data && !error && !nqResult.error) return null;

  return (
    <div className="results-item-wrapper">
      <div className="row">
        <div className="col-4">
          <h2>Total Attention</h2>
          <p>
            Compare the total number of items that matched your queries.
            your queries. Use the &quot;view options&quot; menu to switch between story counts
            and a percentage (if supported).
          </p>
        </div>
        <div className="col-8">
          {(error || nqResult.error) && (
            <Alert severity="warning">
              Our access doesn&apos;t support fetching attention over time data.
              (
              {error.data.note || nqResult.error.data.note}
              )
            </Alert>
          )}
          {(error === undefined && nqResult.error === undefined) && (
          <TotalAttentionChart
            data={data ? normalizeData(data) : normalizeData(nqResult.data.count_over_time)}
            normalized={normalized}
          />
          )}
          <div className="clearfix">
            {(platform === PROVIDER_NEWS_MEDIA_CLOUD
            || platform === PROVIDER_NEWS_WAYBACK_MACHINE) && (
              <div className="float-start">
                {normalized && (
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
                        setNormalized(false);
                        handleClose();
                      }}
                      >
                        View Story Count

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
                        View Normalized Story Percentage (default)
                      </MenuItem>
                    </Menu>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TotalAttentionResults;
