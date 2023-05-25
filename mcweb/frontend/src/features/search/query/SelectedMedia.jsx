import PropTypes from 'prop-types';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { useListCollectionsFromArrayQuery } from '../../../app/services/collectionsApi';
import { useListSourcesFromArrayQuery } from '../../../app/services/sourceApi';

export default function SelectedMedia({
  onRemove, queryIndex, preview,
}) {
  const {
    collections,
    sources,
    previewCollections,
    previewSources,
  } = useSelector((state) => state.query[queryIndex]);

  const dispatch = useDispatch();

  const {
    data: collectionsData,
    isLoadingCollections,
  } = useListCollectionsFromArrayQuery(preview ? previewCollections : collections);

  const {
    data: sourcesData,
    isLoadingSources,
  } = useListSourcesFromArrayQuery(preview ? previewSources : sources);

  if (isLoadingCollections || isLoadingSources) {
    return <CircularProgress size="75px" />;
  }

  if (!collectionsData && !sourcesData) return null;

  return (
    <div className="selected-media-container">
      <div className="selected-media-item-list">
        {sourcesData && (

        <div>
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
        </div>
        )}

        {collectionsData && (

        <div>
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
        )}
      </div>
    </div>
  );
}

SelectedMedia.propTypes = {
  onRemove: PropTypes.func.isRequired,
  queryIndex: PropTypes.number,
  preview: PropTypes.bool,
};

SelectedMedia.defaultProps = {
  queryIndex: 0,
  preview: false,
};
