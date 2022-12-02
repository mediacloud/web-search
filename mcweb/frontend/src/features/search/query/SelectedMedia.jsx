import PropTypes from 'prop-types';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import IconButton from '@mui/material/IconButton';

export default function SelectedMedia({ onRemove, collections }) {
  const dispatch = useDispatch();
  // note: this only supports collectinos right now, but needs to support sources too
  return (
    <div className="selected-media-container">
      <div className="selected-media-item-list">
        {collections.map((collection) => (
          <div className="selected-media-item" key={`selected-media-${collection.id}`}>
            <Link target="_blank" to={`/collections/${collection.id}`}>
              {collection.name}
            </Link>
            <IconButton size="small" aria-label="remove" onClick={() => dispatch(onRemove(collection.id))}>
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
};
