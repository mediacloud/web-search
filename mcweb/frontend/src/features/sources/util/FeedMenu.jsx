import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockClosedIcon from '@mui/icons-material/Lock';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import AlertDialog from '../../ui/AlertDialog';
import { useListFeedsQuery, useLazyFetchFeedQuery } from '../../../app/services/feedsApi';
import { useRescrapeForFeedsMutation } from '../../../app/services/sourceApi';

export default function FeedMenu({ source, disabled }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openRefetch, setOpenRefetch] = useState(false);
  const [openRescrape, setOpenRescrape] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const {
    data: feeds,
  } = useListFeedsQuery({ source_id: source.id });
  const [fetchFeedTrigger] = useLazyFetchFeedQuery();
  const [scrapeForFeeds] = useRescrapeForFeedsMutation();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleRescrape = () => {
    setOpenRescrape(true);
    setOpen(false);
  };

  const handleRefetch = () => {
    setOpenRefetch(true);
    setOpen(false);
  };

  const handleCreateFeed = () => {
    navigate(`/sources/${source.id}/feeds/create`);
    setOpen(false);
  };

  const handleListFeeds = () => {
    navigate(`/sources/${source.id}/feeds`);
    setOpen(false);
  };

  const feedCount = feeds ? feeds.count : 0;

  return (
    <>
      {source.url_search_string && (
      <Button
        variant="outlined"
        disabled={disabled}
        startIcon={(
          <LockClosedIcon
            titleAccess="child sources should not have feeds"
          />
                    )}
      >
        Child Sources should not have feeds
      </Button>
      )}

      <Button
        variant="outlined"
        onClick={handleMenuOpen}
        startIcon={(
          <ListAltIcon
            titleAccess="feeds options"
          />
        )}
        endIcon={<KeyboardArrowDown />}
      >
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        Feeds Options ({feedCount})
      </Button>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        anchorEl={anchorEl}
      >
        <MenuItem>
          {/* LIST FEEDS */}
          <Button
            startIcon={(
              <ListAltIcon
                titleAccess="source's feeds page"
              />
            )}
            onClick={handleListFeeds}
          >
            {`List Feeds (${feedCount})`}
          </Button>
        </MenuItem>
        <MenuItem>
          {/* REFETCH FEEDS */}
          <AlertDialog
            outsideTitle="Refetch Feeds"
            title={`Refetch all of ${source.name} feeds`}
            content="Are you sure you would like to refetch all feeds for this source?
                                After confirming the feeds will be queued for refetching.
                                You can check back at this page in a few minutes to see changes"
            dispatchNeeded={false}
            action={fetchFeedTrigger}
            actionTarget={{ source_id: source.id }}
            snackbar
            snackbarText="Feeds Queued!"
            onClick={handleRefetch}
            openDialog={openRefetch}
            variant="text"
            startIcon={<LockOpenIcon titleAccess="admin-edit" />}
            secondAction={false}
            confirmButtonText="refetch feeds"
            disabled={!!source.url_search_string}
          />
        </MenuItem>
        <MenuItem>
          {/* CREATE FEED */}
          <Button
            variant="text"
            startIcon={<LockOpenIcon titleAccess="admin-create" />}
            onClick={handleCreateFeed}
          >
            Create Feed
          </Button>
        </MenuItem>
        <MenuItem>
          {/* RESCRAPE SOURCE FOR FEEDS */}
          <AlertDialog
            outsideTitle="Rescrape Source"
            title={`Rescrape Source ${source.name} for new Feeds`}
            content={`Are you sure you would like to rescrape ${source.name} for new feeds?
                       Confirming will place this source in a queue to be rescraped for new feeds`}
            dispatchNeeded={false}
            action={scrapeForFeeds}
            actionTarget={source.id}
            snackbar
            snackbarText="Source Queued for Rescraping"
            onClick={handleRescrape}
            openDialog={openRescrape}
            variant="text"
            navigateNeeded={false}
            startIcon={<LockOpenIcon titleAccess="admin-delete" />}
            secondAction={false}
            confirmButtonText="Rescrape"
            disabled={!!source.url_search_string}
          />
        </MenuItem>
      </Menu>
    </>
  );
}

FeedMenu.propTypes = {
  source: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    url_search_string: PropTypes.string,
  }).isRequired,
  disabled: PropTypes.bool.isRequired,
};
