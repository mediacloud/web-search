import React, { useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useGetSourceFeedsMutation } from '../../app/services/feedsApi';

function FeedShow() {
  const params = useParams();
  const sourceId = Number(params.sourceId);

  const [getFeeds, { isLoading, data }] = useGetSourceFeedsMutation();

  useEffect(() => {
    getFeeds(sourceId);
  }, []);

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container">
      <div className="row">
        <h1 className="col-12">Feeds</h1>
      </div>
      <table>
        <thead>
          <tr>
            <th colSpan={1}>Name</th>

            <th colSpan={1}>URL</th>

            <th colSpan={1}>Last Attempt</th>

            <th colSpan={1}>Last Success</th>
          </tr>
        </thead>
        <tbody>
          {data.feeds.map((feed) => (
            <tr key={feed.id}>
              <td>
                <p>
                  {feed.name}
                </p>
              </td>
              <td>
                <a target="_blank" href={`${feed.url}`} rel="noreferrer">
                  {feed.url}
                </a>
              </td>
              <td>
                <p>
                  {dayjs(feed.last_fetch_attempt).format('MM/DD/YYYY')}
                </p>
              </td>
              <td>
                <p>
                  {dayjs(feed.last_fetch_success).format('MM/DD/YYYY')}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FeedShow;
