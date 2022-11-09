import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Alert from '@mui/material/Alert';
import Editor from 'react-simple-code-editor';
import { highlight } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import queryGenerator from '../util/queryGenerator';
import setLanguage from '../util/syntaxHighlighting';
import { setQueryString } from './querySlice';

function AdvancedSearch() {
  const dispatch = useDispatch();
  const {
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query);

  let language = platform ? setLanguage(platform) : null;

  useEffect(() => {
    language = setLanguage(platform);
  }, [platform]);

  const [query, setQuery] = useState(
    queryGenerator(queryList, negatedQueryList, platform, anyAll),
  );

  const handleChange = (queryString) => {
    setQuery(queryString);
    dispatch(setQueryString(queryString));
  };

  return (
    <div className="query-section">
      <h3>
        <em>1</em>
        Enter search phrases
      </h3>
      {language && (
        <Editor
          value={query}
          onValueChange={handleChange}
          highlight={(input) => highlight(input, language)}
          textareaClassName="text-edit"
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            border: '1px solid #e5e5e5',
          }}
        />
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
