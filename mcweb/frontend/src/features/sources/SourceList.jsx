import React, { useState } from 'react';
import dayjs from 'dayjs';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import { useListSourcesQuery } from '../../app/services/sourceApi';
import { PAGE_SIZE } from '../../app/services/queryUtil';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { sourceFavIcon, asNumber } from '../ui/uiUtil';

const utc = require('dayjs/plugin/utc');

export default function SourceList(props) {
  dayjs.extend(utc);
  const { collectionId, edit, staticCollection } = props;
  const [page, setPage] = useState(0);
  const {
    data: sources,
    isLoading,
  } = useListSourcesQuery({ collection_id: collectionId, page });

  const [deleteSourceCollectionAssociation] = useDeleteSourceCollectionAssociationMutation();

  // if loading
  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <>
      <h2>
        Sources (
        {asNumber(sources.count)}
        )
      </h2>
      { (Math.ceil(sources.count / PAGE_SIZE) > 1) && (
        <Pagination
          count={Math.ceil(sources.count / PAGE_SIZE)}
          page={page + 1}
          color="primary"
          onChange={(evt, value) => setPage(value - 1)}
        />
      )}
      { (sources.count > 0) && (
        <table width="100%">
          <thead>
            <tr>
              <Tooltip
                title="The domain that uniquely identifies the Source within our system for
                searching against the Online News Archive."
              >
                <th>Domain</th>
              </Tooltip>
              <Tooltip
                title="The primary country this Source is publishing from or
                where their headquarters are located. This is the 3-letter ISO 3166-1 alpha-3 standard format"
              >
                <th>Publication Country</th>
              </Tooltip>
              <Tooltip
                title="The primary state or province this Source is publishing from or
                where their headquarters are located. This is the ISO 3166-2 standard format"
              >
                <th>Publication State</th>
              </Tooltip>
              <Tooltip
                title="Our system guesses the primary language of each article it ingests.
                For each Source we indicate the language the majority of its articles are in
                (if we have enough to measure)."
              >
                <th>Primary Language</th>
              </Tooltip>
              <Tooltip
                title="The average number of stories published by this Source per week,
                 based on our ingestion."
              >
                <th>Content per Week</th>
              </Tooltip>
              <Tooltip
                title="The last time our system tried to automatically check the website for more feeds
                we can use to ingest stories every day. “?” means it hasn't tried since fall 2023."
              >
                <th>Last Checked For New Feeds</th>
              </Tooltip>
              {edit && (<th>Admin</th>)}
            </tr>
          </thead>
          <tbody>
            {sources.results.map((source) => (
              <tr key={source.id}>
                <td>
                  <img
                    className="google-icon"
                    src={sourceFavIcon(source)}
                    alt="{source.name}"
                    width="32px"
                  />
                  <Link to={`/sources/${source.id}`}>
                    {source.url_search_string ? (`${source.label} (child source)` || `${source.name} (child source)`)
                      : (source.label || source.name)}
                  </Link>
                </td>
                <td>{source.pub_country}</td>
                <td>{source.pub_state}</td>
                <td>{source.primary_language}</td>
                <td>{asNumber(source.stories_per_week)}</td>
                {source.url_search_string && (
                  <td>
                    N/A (child source)
                  </td>
                )}
                {!source.url_search_string && (
                  <td>{source.last_rescraped ? dayjs.utc(source.last_rescraped).local().format('MM/DD/YYYY') : '?'}</td>
                )}
                {edit && (
                  <td>
                    <IconButton
                      aria-label="remove"
                      disabled={staticCollection}
                      onClick={() => {
                        deleteSourceCollectionAssociation({
                          source_id: source.id,
                          collection_id: collectionId,
                        });
                      }}
                    >
                      <HighlightOffIcon />
                    </IconButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

SourceList.propTypes = {
  collectionId: PropTypes.number.isRequired,
  edit: PropTypes.bool,
  staticCollection: PropTypes.bool,
};

SourceList.defaultProps = {
  edit: false,
  staticCollection: false,
};
