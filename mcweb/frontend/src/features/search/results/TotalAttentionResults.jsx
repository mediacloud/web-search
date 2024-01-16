import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Settings from '@mui/icons-material/Settings';
import TotalAttentionEmailModal from '../../ui/TotalAttentionEmailModal';
import BarChart from './BarChart';
import { useGetTotalCountMutation } from '../../../app/services/searchApi';
import {
  PROVIDER_REDDIT_PUSHSHIFT,
  PROVIDER_NEWS_WAYBACK_MACHINE,
  PROVIDER_NEWS_MEDIA_CLOUD,
  PROVIDER_NEWS_MEDIA_CLOUD_LEGACY,
} from '../util/platforms';
import { selectCurrentUser } from '../../auth/authSlice';
import checkForBlankQuery from '../util/checkForBlankQuery';
import prepareQueries from '../util/prepareQueries';
import prepareTotalAttentionData from '../util/prepareTotalAttentionData';

export const supportsNormalizedCount = (platform) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  [PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_REDDIT_PUSHSHIFT,
    PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_MEDIA_CLOUD_LEGACY].includes(platform);

function TotalAttentionResults() {
  const queryState = useSelector((state) => state.query);

  const [openModal, setModalOpen] = useState(false);

  // fetch currentUser to access email if their downloaded csv needs to be emailed
  const currentUser = useSelector(selectCurrentUser);

  const {
    platform,
    lastSearchTime,
  } = queryState[0];

  const [normalized, setNormalized] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);

  const [newQuery, setNewQuery] = useState(false);

  const handleClick = (e) => setAnchorEl(e.currentTarget);

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const [dispatchQuery, { isLoading, data, error }] = useGetTotalCountMutation();

  const currentUserEmail = currentUser.email;

  const getCountsArray = (countsData) => countsData.map((count) => count.count.relevant);

  const getTotalCountOfQuery = () => {
    const arrayOfCounts = getCountsArray(data);
    let count = 0;
    for (let i = 0; i < arrayOfCounts.length; i += 1) {
      count += arrayOfCounts[i];
    }
    return count;
  };

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

  if (newQuery) return null;

  if (isLoading) {
    return (
      <div>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <CircularProgress size="75px" />
      </div>
    );
  }

  if (!data && !error) return null;

  let content;
  if (error) {
    content = (
      <Alert severity="warning">
        Sorry, but something went wrong.
        (
        {error.note}
        )
      </Alert>
    );
  } else {
    const preparedTAdata = prepareTotalAttentionData(data, normalized);

    if (preparedTAdata.length !== queryState.length) return null;
    const updatedTotalAttentionData = preparedTAdata.map(
      (originalDataObj, index) => {
        const queryTitleForPreparation = { name: queryState[index].name };
        return { ...queryTitleForPreparation, ...originalDataObj };
      },
    );
    content = (
      <>
        <div>
          <BarChart
            series={updatedTotalAttentionData}
            normalized={normalized}
            title="Total Stories Count"
            height={200}
          />
        </div>

        <div className="clearfix">
          {supportsNormalizedCount(platform) && (
            <div className="float-start">
              {normalized && (
                <div>
                  <Button
                    onClick={handleClick}
                    variant="outlined"
                    startIcon={
                      <Settings titleAccess="view other chart viewing options" />
                    }
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
                    <MenuItem
                      onClick={() => {
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
                  <Button variant="outlined" onClick={handleClick}>View Options...</Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button',
                    }}
                  >
                    <MenuItem
                      onClick={() => {
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

          <div className="float-end">
            <div>
              <TotalAttentionEmailModal
                outsideTitle="Download All URLs"
                title={
                `Your current email is: ${currentUserEmail}
                Would you like to send your downloaded data to your current email or a new email?`
              }
                content="Enter a new email?"
                dispatchNeeded={false}
                navigateTo="/"
                onClick={() => setModalOpen(true)}
                openDialog={openModal}
                variant="outlined"
                confirmButtonText="Confirm New Email"
                currentUserEmail={currentUserEmail}
                totalCountOfQuery={getTotalCountOfQuery()}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="results-item-wrapper">
      <div className="row">
        <div className="col-4">
          <h2>Total Attention</h2>
          <p>
            Compare the total number of items that matched your queries. Use the
            &quot;view options&quot; menu to switch between story counts and a
            percentage (if supported).

            Click &quot;Download All URLs&quot; to the bottom-right to download a CSV of all the
            matching content and associated metadata.
          </p>
        </div>
        <div className="col-8">
          {content}
        </div>
      </div>
    </div>
  );
}

export default TotalAttentionResults;
