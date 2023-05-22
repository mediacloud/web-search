import PropTypes from 'prop-types';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { useListCollectionsFromArrayQuery } from '../../../app/services/collectionsApi';
import { useListSourcesQuery } from '../../../app/services/sourceApi';

export default function SelectedMedia({
  onRemove, queryIndex,
}) {
  const {
    collections,
    sources,
  } = useSelector((state) => state.query[queryIndex]);

  const dispatch = useDispatch();
  // note: this only supports collections right now, but needs to support sources too
  const {
    data: collectionsData,
    isLoadingCollections,
  } = useListCollectionsFromArrayQuery(collections);

  const {
    data: sourcesData,
    isLoadingSources,
  } = useListSourcesFromArrayQuery(sources);

  // const {
  //   data: sourcesData,
  //   isLoadingSources,
  // } = useListSourcesQuery({ source_id: sources, page });

  console.log('collections', collectionsData);
  // console.log('sources', sourcesData);
  if (isLoadingCollections) {
    return <CircularProgress size="75px" />;
  }

  if (!collectionsData && !sourcesData) return null;

  return (
    <div className="selected-media-container">
      <div className="selected-media-item-list">
        {sourcesData.sources.map((source) => (
          <div className="selected-media-item" key={`selected-media-${source.id}`}>
            <Link
              target="_blank"
              to={`/sources/${source.id}`}
              style={{
                display: 'block',
                whiteSpace: 'normal',
                width: '100%',
              }}
            >
              {source.label || source.name}
            </Link>
            <IconButton
              size="small"
              aria-label="remove"
              onClick={() => dispatch(onRemove({ sourceOrCollection: { type: 'source', id: source.id }, queryIndex }))}
            >
              <RemoveCircleIcon sx={{ color: '#d24527' }} />
            </IconButton>
          </div>
        ))}
        {collectionsData.collections.map((collection) => (
          <div className="selected-media-item" key={`selected-media-${collection.id}`}>
            <Link
              target="_blank"
              to={`/collections/${collection.id}`}
              style={{
                display: 'block',
                whiteSpace: 'normal',
                width: '100%',
              }}
            >
              {collection.name}
            </Link>

            <IconButton
              size="small"
              aria-label="remove"
              onClick={() => dispatch(onRemove({ sourceOrCollection: { type: 'collection', id: collection.id }, queryIndex }))}
            >
              <RemoveCircleIcon sx={{ color: '#d24527' }} />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
}

SelectedMedia.propTypes = {
  onRemove: PropTypes.func.isRequired,
  collections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  sources: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  queryIndex: PropTypes.number,
};

SelectedMedia.defaultProps = {
  queryIndex: 0,
};
