import React, { useState } from 'react';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { PAGE_SIZE } from '../../app/services/queryUtil';
import { useListFeedsQuery, useListFeedDetailsQuery } from '../../app/services/feedsApi';
import { asNumber } from '../ui/uiUtil';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';

function ListSourceFeeds() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const [page, setPage] = useState(0);

  // query for the list of feeds on this source...
  const {
    data: feeds,
    isLoading: feedsAreLoading,
  } = useListFeedsQuery({source_id: sourceId});
  // ...and also their latest from the RSS-fetcher
  const {
    data: feedDetails,
    isLoading: feedsDetailsAreLoading,
  } = useListFeedDetailsQuery({source_id: sourceId});

  const isLoading = feedsAreLoading || feedsDetailsAreLoading;

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  if (!feeds) return null;

  return (
    <div className="container">
      <div className="row">
        <h1 className="col-12">Feeds ({asNumber(feeds.count)})</h1>
      </div>
      {(Math.ceil(feeds.count / PAGE_SIZE) > 1) && (
        <Pagination
          count={Math.ceil(feeds.count / PAGE_SIZE)}
          page={page+1}
          color="primary"
          onChange={(evt, value) => setPage(value-1)}/>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Admin enabled?</th>
            <th>Last Attempt</th>
            <th>Last Success</th>
            <Permissioned role={ROLE_STAFF}>
              <th></th>
            </Permissioned>
          </tr>
        </thead>
        <tbody>
          {feeds.results.map((feed) => (
            <tr key={feed.id}>
              <td>{feed.name}</td>
              <td><a target="_blank" href={`${feed.url}`} rel="noreferrer">{feed.url}</a></td>
              <td>{feed.admin_rss_enabled ? '✅' : '❌'}</td>
              <td>{feed.last_fetch_attempt ? dayjs(feed.last_fetch_attempt).format('MM/DD/YYYY') : '?'}</td>
              <td>{feed.last_fetch_success ? dayjs(feed.last_fetch_success).format('MM/DD/YYYY') : '?'}</td>
              <td>
                <Permissioned role={ROLE_STAFF}>
                  <>
                    <Button variant="outlined" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                    <Button variant="outlined" startIcon={<DeleteIcon />}>
                      Delete
                    </Button>
                  </>
                </Permissioned>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListSourceFeeds;
