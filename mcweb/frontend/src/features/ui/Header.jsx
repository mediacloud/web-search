import * as React from 'react';
import PropTypes from 'prop-types';

export default function Header({
  children, columns, id, reversed, customColumns,
}) {
  return (
    <div id={id} className={`feature-area filled ${reversed ? 'reverse' : ''}`}>
      <div className="container">
        <div className="row">
          {!customColumns && (
          <div className={`col-${columns}`}>
            {children}
          </div>
          )}
          {customColumns && children}
        </div>
      </div>
    </div>
  );
}

Header.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.number,
  customColumns: PropTypes.bool,
  id: PropTypes.string,
  reversed: PropTypes.bool,
};

Header.defaultProps = {
  columns: 12,
  customColumns: false,
  id: null,
  reversed: false,
};
