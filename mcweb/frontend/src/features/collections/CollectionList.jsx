import React, { useState } from 'react';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import ShieldIcon from '@mui/icons-material/Shield';
import { Link } from 'react-router-dom';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import { useListCollectionsQuery } from '../../app/services/collectionsApi';
import { PAGE_SIZE } from '../../app/services/queryUtil';
import { useDeleteSourceCollectionAssociationMutation } from '../../app/services/sourcesCollectionsApi';
import { asNumber, platformIcon } from '../ui/uiUtil';

export default function CollectionList(props) {
  const { sourceId, edit } = props;
  const [page, setPage] = useState(0);
  const {
    data: collections,
    isLoading,
  } = useListCollectionsQuery({ source_id: sourceId, page });

  const [deleteSourceCollectionAssociation] = useDeleteSourceCollectionAssociationMutation();

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <>
      <h2>
        Collections (
        {asNumber(collections.count)}
        )
      </h2>
      {(Math.ceil(collections.count / PAGE_SIZE) > 1) && (
        <Pagination
          count={Math.ceil(collections.count / PAGE_SIZE)}
          page={page + 1}
          color="primary"
          onChange={(evt, value) => setPage(value - 1)}
        />
      )}
      {(collections.count > 0) && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sources</th>
              {edit && <th>Admin</th>}
            </tr>
          </thead>
          <tbody>
            {collections.results.map((collection) => {
              const PlatformIcon = platformIcon(collection.platform);
              return (
                <tr key={collection.id}>
                  <td>
                    <PlatformIcon fontSize="small" />
                    &nbsp;
                    <Link to={`/collections/${collection.id}`}>
                      {collection.name}
                    </Link>
                    {!collection.public && <ShieldIcon fontSize="small" titleAccess="private" />}
                  </td>
                  <td className="numeric">{asNumber(collection.source_count)}</td>
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
              );
            })}
          </tbody>
        </table>
      )}
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
