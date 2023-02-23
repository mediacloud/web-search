import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import queryGenerator from '../util/queryGenerator';

export default function QueryPreview({ queryIndex }) {
  const {
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query[queryIndex]);

  let query = queryGenerator(queryList, negatedQueryList, platform, anyAll);

  useEffect(() => {
    query = queryGenerator(queryList, negatedQueryList, platform, anyAll);
  }, [queryList, negatedQueryList]);

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
