import React from 'react';
import Proptypes from 'prop-types';

function FeedItem({ feed }) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          Hello
        </div>
      </div>
    </div>
  );
}

FeedItem.propTypes = {
  feed: Proptypes.object.isRequired,
};
export default FeedItem;
