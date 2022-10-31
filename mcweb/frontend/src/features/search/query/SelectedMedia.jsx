import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';

export default function SelectedMedia({ onRemove }) {
  const { collections } = useSelector((state) => state.query);
  const dispatch = useDispatch();
  return (
    <div className="selected-media-container">
      <div className="selected-media-item-list">
        {collections.map((collection) => (
          <div className="selected-media-item" key={`selected-media-${collection.id}`}>
            {collection.name}
            <div onClick={() => dispatch(onRemove(collection.id))}>
              <RemoveCircleIcon sx={{ color: '#d24527' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
