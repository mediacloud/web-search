import PropTypes from 'prop-types';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import { Link } from 'react-router-dom';
import { asNumber } from '../../../ui/uiUtil';

export default function MediaPickerSelectionTable({
  selected, matching, onAdd, onRemove, collection, queryIndex, isGlobalCollection,
}) {
  const dispatch = useDispatch();
  const alreadySelected = (cid) => selected.includes(cid);

  return (
    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Description</th>
          {collection && !isGlobalCollection && (
            <th>Sources</th>
          )}
          {!collection && (
            <th>Stories per week</th>
          )}
        </tr>
        {matching.map((c) => (
          <tr key={c.id}>
            <td>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                to={collection ? `/collections/${c.id}` : `/sources/${c.id}`}
              >
                {c.name}
              </Link>
            </td>
            <td>{collection ? c.notes : c.label}</td>
            {collection && !isGlobalCollection && (
              <td className="numeric">{asNumber(c.source_count)}</td>
            )}
            {!collection && (
            <td>{c.stories_per_week?.toString() ?? '?'}</td>
            )}
            <td>
              {!(alreadySelected(c.id)) && (
                <IconButton
                  size="sm"
                  aria-label="add"
                  onClick={() => dispatch(onAdd(
                    { sourceOrCollection: { id: c.id, type: collection ? 'collection' : 'source' }, queryIndex },
                  ))}
                >
                  <AddCircleIcon sx={{ color: '#d24527' }} />
                </IconButton>
              )}
              {(alreadySelected(c.id)) && (
                <IconButton
                  size="sm"
                  aria-label="remove"
                  onClick={() => dispatch(onRemove(
                    { sourceOrCollection: { ...c, type: collection ? 'collection' : 'source' }, queryIndex },
                  ))}
                >
                  <RemoveCircleIcon sx={{ color: '#d24527' }} />
                </IconButton>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

MediaPickerSelectionTable.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  matching: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  selected: PropTypes.arrayOf(PropTypes.number).isRequired,
  collection: PropTypes.bool.isRequired,
  queryIndex: PropTypes.number.isRequired,
  isGlobalCollection: PropTypes.bool.isRequired,
};
