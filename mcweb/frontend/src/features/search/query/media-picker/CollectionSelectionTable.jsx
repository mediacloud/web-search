import PropTypes from 'prop-types';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutline';
import { Link } from 'react-router-dom';
import { asNumber } from '../../../ui/uiUtil';

export default function CollectionSelectionTable({
  selected, matching, onAdd, onRemove,
}) {
  const dispatch = useDispatch();
  const alreadySelected = (cid) => selected.map((c) => c.id).includes(cid);
  return (
    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Sources</th>
        </tr>
        {matching.map((c) => (
          <tr key={c.id}>
            <td><Link target="_blank" rel="noopener noreferrer" to={`/collections/${c.id}`}>{c.name}</Link></td>
            <td>{c.notes}</td>
            <td class="numeric">{asNumber(c.source_count)}</td>
            <td>
              {!(alreadySelected(c.id)) && (
                <IconButton size="sm" aria-label="add" onClick={() => dispatch(onAdd(c))}>
                  <AddCircleIcon sx={{ color: '#d24527' }} />
                </IconButton>
              )}
              {(alreadySelected(c.id)) && (
                <IconButton size="sm" aria-label="remove" onClick={() => dispatch(onRemove(c.id))}>
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

CollectionSelectionTable.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  matching: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  selected: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,

};
