import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';

import { useGetSourceAssociationsQuery, useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';

export default function CollectionList(props) {
  const { sourceId, edit } = props;
  const {
    data,
    isLoading,
  } = useGetSourceAssociationsQuery(sourceId);

  const [deleteSourceCollectionAssociation] = useDeleteSourceCollectionAssociationMutation();

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
    <>
      <h2>
        Collections (
        {data.collections.length}
        )
      </h2>
      <table>
        <thead>
          <tr>
            <th colSpan={edit ? 2 : 1}>Name</th>
          </tr>
        </thead>
        <tbody>
          {data.collections.map((collection) => (
            <tr key={collection.id}>
              <td>
                <Link to={`/collections/${collection.id}`}>
                  {collection.name}
                </Link>
              </td>
              { edit && (
                <td>
                  <IconButton
                    aria-label="remove"
                    onClick={() => {
                      deleteSourceCollectionAssociation({
                        source_id: sourceId,
                        collection_id: collection.id,
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
    </>
  );
}

CollectionList.propTypes = {
  sourceId: PropTypes.number.isRequired,
  edit: PropTypes.bool,
};

CollectionList.defaultProps = {
  edit: false,
};
