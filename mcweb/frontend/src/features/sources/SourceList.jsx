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
import sourceTooltips from './util/sourceTooltips';

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
  const tt = sourceTooltips();

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
              <Tooltip title={tt.name}>
                <th>Domain</th>
              </Tooltip>
              <Tooltip title={tt.pub_country}>
                <th>Publication Country</th>
              </Tooltip>
              <Tooltip title={tt.pub_state}>
                <th>Publication State</th>
              </Tooltip>
              <Tooltip title={tt.primary_language}>
                <th>Primary Language</th>
              </Tooltip>
              <Tooltip title={tt.stories_per_week}>
                <th>Content per Week</th>
              </Tooltip>
              <Tooltip title={tt.last_story}>
                <th>New Stories In</th>
              </Tooltip>
              <Tooltip title={tt.last_rescraped}>
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
                <td>{source.last_story}</td>
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
