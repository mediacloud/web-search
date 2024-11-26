import React, { useState } from 'react';
import dayjs from 'dayjs';
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
              <th>Name</th>
              <th>Content per Week</th>
              <th>Last Rescraped</th>
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
                    {source.label || source.name}
                  </Link>
                </td>
                <td>{asNumber(source.stories_per_week)}</td>
                <td>{source.last_rescraped ? dayjs.utc(source.last_rescraped).local().format('MM/DD/YYYY') : '?'}</td>
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
