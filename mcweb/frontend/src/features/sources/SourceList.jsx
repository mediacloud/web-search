import React, { useState } from 'react';
import Pagination from '@mui/material/Pagination';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import { useListSourcesQuery, PAGE_SIZE } from  '../../app/services/sourceApi';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { googleFaviconUrl, asNumber } from '../ui/uiUtil';

export default function SourceList(props) {
  const { collectionId, edit } = props;
  const [page, setPage] = useState(0);
  const {
    data: sources,
    isLoading,
  } = useListSourcesQuery({collectionId, page});


  const [deleteSourceCollectionAssociation] = useDeleteSourceCollectionAssociationMutation();

  // if loading
  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div>
      <h2>
        Sources (
        {asNumber(sources.count)}
        )
      </h2>
      { (Math.ceil(sources.count / PAGE_SIZE) > 1) && (
        <Pagination
          count={Math.ceil(sources.count / PAGE_SIZE)}
          page={page+1}
          color="primary"
          onChange={(evt, value) => setPage(value-1)}/>
      )}
      <table width="100%">
        <thead>
          <tr>
            <th colSpan="2">Name</th>
            <th>Content per Week</th>
            {edit && (<th></th>)}
          </tr>
        </thead>
        <tbody>
          {sources.results.map((source) => (
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
              <td class="numeric">{asNumber(source.stories_per_week)}</td>
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
