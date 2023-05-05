import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import tabTitle from '../util/tabTitle';
// import queryGenerator from '../util/queryGenerator';

export default function QueryPreview({ queryIndex }) {
  const queryState = useSelector((state) => state.query);

  let query = tabTitle(queryState, queryIndex);

  useEffect(() => {
    query = tabTitle(queryState, queryIndex);
  }, [queryState]);

  return (
    <>
      <code>{query || '(enter some phrases to the left)'}</code>
      <p className="help">
        Your search phrases are being translated automatically into the query
        syntax supported by the platform you are searching against. This saves you
        from having to learn the esoteric syntax for each platform and API.
      </p>
    </>
  );
}

QueryPreview.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
