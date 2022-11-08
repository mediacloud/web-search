import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import queryGenerator from '../util/queryGenerator';

function AdvancedSearch() {
  const {
    queryList,
    negatedQueryList,
    platform,
    anyAll,
  } = useSelector((state) => state.query);

  const [query, setQuery] = useState(queryGenerator(queryList, negatedQueryList, platform, anyAll));

  return (
    <div>
      <Editor
        value={query}
        onValueChange={(query) => setQuery(query)}
        highlight={(query) => highlight(query, setLanguage(platform))}
        textareaClassName="text-edit"
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12,
        }}
      />
    </div>
  );
}

export default AdvancedSearch;
