const getChildSources = (sourceName, sourceList) => {
  if (!sourceList) return null;
  const childSources = [];
  sourceList.results.forEach((source) => {
    if (source.name === String(sourceName) && source.url_search_string) {
      childSources.push(source);
    }
  });
  return childSources.length > 0 ? childSources : null;
};

export default getChildSources;
