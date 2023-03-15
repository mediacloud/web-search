import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Settings } from '@mui/icons-material';
import BarChart from './BarChart';
import queryGenerator from '../util/queryGenerator';
import { useGetTotalCountMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_REDDIT_PUSHSHIFT, PROVIDER_NEWS_WAYBACK_MACHINE,
} from '../util/platforms';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import prepareTotalAttentionData from '../util/prepareTotalAttentionData';

export const supportsNormalizedCount = (platform) => [
  PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_REDDIT_PUSHSHIFT].includes(platform);

function TotalAttentionResults() {
  const queryState = useSelector((state) => state.query);

  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  // const fullQuery = queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll);

  const [normalized, setNormalized] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const [dispatchQuery, { isLoading, data, error }] = useGetTotalCountMutation();

  // const collectionIds = collections.map((c) => c.id);
  // const sourceIds = sources.map((s) => s.id);

  // using EPSILON in the denominator here prevents against div by zero errors
  // (which returns infinity in JS)
  // const normalizeData = (oldData) => 100 * (oldData.count.relevant
  //   / (oldData.count.total + Number.EPSILON));

  // useEffect(() => {
  //   if ((queryList[0].length !== 0) || (advanced && queryString !== 0)) {
  //     query({
  //       query: fullQuery,
  //       startDate,
  //       endDate,
  //       collections: collectionIds,
  //       sources: sourceIds,
  //       platform,
  //     });
  //     setNormalized(supportsNormalizedCount(platform));
  //   }
  // }, [lastSearchTime]);

  useEffect(() => {
    if (checkForBlankQuery(queryState)) {
      const preparedQueries = prepareQueries(queryState);
      dispatchQuery(preparedQueries);
      setNormalized(supportsNormalizedCount(platform));
    }
  }, [lastSearchTime]);

  if (isLoading) {
    return (
      <div>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <CircularProgress size="75px" />
      </div>
    );
  }

  if (!data && !error) return null;

  const seriesData = () => {
    const series = [];
    console.log(data);
  };

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
          {(error) && (
            <Alert severity="warning">
              Sorry, but something went wrong.
              (
              {error.data.note}
              )
            </Alert>
          )}
          {console.log(data, queryState, normalized)}
          {console.log(prepareTotalAttentionData(data, queryState, normalized))}
          {(error === undefined) && (
            <BarChart
              // series={[{
              //   data: [{ key: fullQuery, value: (normalized) ? normalizeData(data) : data.count.relevant }],
              //   name: 'Matching Content',
              //   color: '#2f2d2b',
              // }]}
              series={prepareTotalAttentionData(data, queryState, normalized)}
              normalized={normalized}
              title="Total Stories Count"
              height={200}
            />
          )}
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
