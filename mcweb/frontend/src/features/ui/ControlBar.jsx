import * as React from 'react';
import PropTypes from 'prop-types';

export default function ControlBar({ children, customColumns }) {
  return (
    <div className="sub-feature">
      <div className="container">
        <div className="row">
          {!customColumns && (
            <div className="col-12">
              {children}
            </div>
          )}
          {customColumns && children}
        </div>
      </div>
    </div>
  );
}

ControlBar.propTypes = {
  children: PropTypes.node.isRequired,
  customColumns: PropTypes.bool,
};

ControlBar.defaultProps = {
  customColumns: false,
};
