import React from 'react';
import PropTypes from 'prop-types';
import { assetUrl } from './uiUtil';

function MediaNotFound({ source }) {
  const title = source ? 'Source Not Found' : 'Collection Not Found';
  const text = source ? 'source' : 'collection';
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>{title}</h1>
      <p>
        The
        {' '}
        {text}
        {' '}
        you are looking for cannot be found.
      </p>
      <div className="fail-text">
        <img className="fail-img" src={assetUrl('img/fail-fox-bad-url.png')} alt="failed url fox" />
      </div>
    </div>
  );
}
MediaNotFound.propTypes = {
  source: PropTypes.bool.isRequired,
};

export default MediaNotFound;
