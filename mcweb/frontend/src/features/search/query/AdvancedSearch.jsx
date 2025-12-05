import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Editor from 'react-simple-code-editor';
import { highlight } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import queryGenerator from '../util/queryGenerator';
import setLanguage from '../util/setLanguage';
import { setQueryProperty, copyToAllQueries, QUERY } from './querySlice';
import CopyToAll from '../util/CopyToAll';

function AdvancedSearch({ queryIndex }) {
  const dispatch = useDispatch();

  const [openCopy, setOpenCopy] = useState(false);
  const {
    queryString,
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query[queryIndex]);

  let language = platform ? setLanguage(platform) : null;

  const replaceSpecialQuotes = (s) => {
    let result = s.replaceAll('“', '"');
    result = result.replaceAll('”', '"');
    return result;
  };

  useEffect(() => {
    language = setLanguage(platform);
  }, [platform]);

  const [query, setQuery] = useState(
    replaceSpecialQuotes(queryString) || queryGenerator(queryList, negatedQueryList, platform, anyAll),
  );

  const handleChange = (queryArg) => {
    const replacedQuery = replaceSpecialQuotes(queryArg);
    setQuery(replacedQuery);
    dispatch(setQueryProperty({
      queryString: replacedQuery, queryIndex, property: 'queryString', name: replacedQuery,
    }));
  };

  return (
    <div className="query-section">
      <div className="copy-toall">
        <h3>
          <em>1</em>
          Enter search phrases
        </h3>
        <CopyToAll
          openDialog={openCopy}
          title="Copy To All Queries"
          content="Are you sure you want to copy these keywords
                to all your queries? This will replace the keywords for all of your queries."
          action={copyToAllQueries}
          actionTarget={{ property: QUERY, queryIndex }}
          snackbar
          snackbarText="Media Copied To All Queries"
          dispatchNeeded
          onClick={() => setOpenCopy(true)}
          className="float-end"
          confirmButtonText="OK"
        />
      </div>
      {language && (
        <div className="container">
          <div className="row">
            <div className="col-4">
              <p>

                Please enter query terms following the
                {' '}
                <a target="_blank" href="https://www.mediacloud.org/documentation/query-guide" rel="noreferrer">
                  proper query syntax
                </a>
                {' '}
                for the choosen platform.
                Remember to capitalize the boolean operators.
              </p>
            </div>
            <div className="col-5">
              <Editor
                value={query}
                onValueChange={handleChange}
                highlight={(input) => highlight(input, language)}
                textareaClassName="text-edit"
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                  border: '1px solid #e5e5e5',
                }}
              />
            </div>
          </div>
        </div>
      )}
      {!language && (
        <Alert severity="warning">
          Please choose a platform
        </Alert>
      )}
    </div>
  );
}

AdvancedSearch.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};

export default AdvancedSearch;
