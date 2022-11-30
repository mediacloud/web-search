import * as React from 'react';
import PropTypes from 'prop-types';

export default function StatPanel({ items }) {
  return (
    <div className="row">
      {items.map((item) => (
        <div className="col-2" key={`item-${item.label}`}>
          <div className="stat-item">
            <em className="small-label">{item.label}</em>
            {item.value || '?'}
          </div>
        </div>
      ))}
    </div>
  );
}

StatPanel.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
  })).isRequired,
};
