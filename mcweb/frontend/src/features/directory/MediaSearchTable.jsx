import PropTypes from 'prop-types';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { asNumber } from '../ui/uiUtil';
import { selectCurrentUser } from '../auth/authSlice';

export default function MediaSearchTable({
  matching, collection, isGlobalCollection,
}) {
  const currentUser = useSelector(selectCurrentUser);
  const staffUser = currentUser.isStaff === true;
  const filteredMatching = staffUser ? matching : matching.filter((c) => c.public === true);

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
        {filteredMatching.map((c) => (
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}

MediaSearchTable.propTypes = {
  matching: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  collection: PropTypes.bool.isRequired,
  isGlobalCollection: PropTypes.bool.isRequired,
};
