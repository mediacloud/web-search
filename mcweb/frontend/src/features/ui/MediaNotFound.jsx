import React from 'react';
import PropTypes from 'prop-types';
import { assetUrl } from './uiUtil';

function MediaNotFound({ type }) {
  const getText = () => {
    let title = '';
    let text = '';
    if (type === 'source') {
      title = 'Source Not Found';
      text = 'The source you are looking for cannot be found.';
    } else if (type === 'collection') {
      title = 'Collection Not Found';
      text = 'The collection you are looking for cannot be found.';
    } else if (type === 'feed') {
      title = 'Feed Not Found';
      text = 'The feed you are looking for cannot be found.';
    }
    return { title, text };
  }
  const {title, text } = getText(type);
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>{title}</h1>
      <p>
        {text}
      </p>
      <div className="fail-text">
        <img className="fail-img" src={assetUrl('img/fail-fox-bad-url.png')} alt="failed url fox" />
      </div>
    </div>
  );
}
MediaNotFound.propTypes = {
  type: PropTypes.string.isRequired,
};

export default MediaNotFound;
