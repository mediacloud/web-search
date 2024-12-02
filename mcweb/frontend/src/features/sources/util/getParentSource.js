const getParentSource = (sourceName, sourceList) => {
  if (!sourceList) return null;
  let parentSource = null;
  sourceList.results.forEach((source) => {
    if (source.name === String(sourceName) && !source.url_search_string) {
      parentSource = source;
    }
  });
  return parentSource;
};

export default getParentSource;
