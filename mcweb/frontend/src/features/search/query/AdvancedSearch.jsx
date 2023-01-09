import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Alert from '@mui/material/Alert';
import Editor from 'react-simple-code-editor';
import { highlight } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import queryGenerator from '../util/queryGenerator';
import setLanguage from '../util/setLanguage';
import { setQueryProperty } from './querySlice';

function AdvancedSearch() {
  const dispatch = useDispatch();
  const {
    queryString,
    queryList,
    negatedQueryList,
    platform,
    anyAll,
    advanced,
  } = useSelector((state) => state.query);

  let language = platform ? setLanguage(platform) : null;

  useEffect(() => {
    language = setLanguage(platform);
  }, [platform]);

  useEffect(() => {
    dispatch(setQueryProperty({ queryString: queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll) }));
  }, [advanced]);

  const [query, setQuery] = useState(
    queryString || queryGenerator(queryList, negatedQueryList, platform, anyAll),
  );

  const handleChange = (queryArg) => {
    setQuery(queryArg);
    dispatch(setQueryProperty({ queryString: queryArg }));
  };

  return (
    <div className="query-section">
      <h3>
        <em>1</em>
        Enter search phrases
      </h3>
      {language && (
        <div className="container">
          <div className="row">
            <div className="col-4">
              <p>
                Please enter query terms following the proper query syntax
                for the choosen platform.
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

export default AdvancedSearch;
