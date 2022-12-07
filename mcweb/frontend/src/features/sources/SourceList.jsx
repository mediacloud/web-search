import React, { useState } from 'react';
import Pagination from '@mui/material/Pagination';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';

import { useListSourcesQuery, PAGE_SIZE } from  '../../app/services/sourceApi';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { googleFaviconUrl } from '../ui/uiUtil';

export default function SourceList(props) {
  const { collectionId, edit } = props;
  const [page, setPage] = useState(0);
  const {
    data,
    isLoading,
  } = useListSourcesQuery({collectionId, page});

  const [deleteSourceCollectionAssociation] = useDeleteSourceCollectionAssociationMutation();

  // if loading
  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <div>
      <h2>
        Sources (
        {data.count}
        )
      </h2>
      <Pagination
        count={Math.ceil(data.count / PAGE_SIZE)}
        page={page+1}
        color="primary"
        onChange={(evt, value) => setPage(value-1)}/>
      <table width="100%">
        <thead>
          <tr>
            <th colSpan="2">Name</th>
            <th>Stories per Week</th>
            {edit && (<th></th>)}
          </tr>
        </thead>
        <tbody>
          {data.results.map((source) => (
            <tr key={source.id}>
              <td>
                <a href={source.homepage} target="_new">
                  <img
                    className="google-icon"
                    src={googleFaviconUrl(source.homepage || `https://{source.domain}`)}
                    alt="{source.name}"
                  />
                </a>
              </td>
              <td>
                <Link to={`/sources/${source.id}`}>
                  {source.label || source.name}
                </Link>
              </td>
              <td>{source.stories_per_week}</td>
              {edit && (
                <td>
                  <IconButton
                    aria-label="remove"
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
    </div>
  );
}

SourceList.propTypes = {
  collectionId: PropTypes.number.isRequired,
  edit: PropTypes.bool,
};

SourceList.defaultProps = {
  edit: false,
};
