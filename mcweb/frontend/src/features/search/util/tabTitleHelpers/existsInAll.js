const existsInAll = (phrase, queryLists) => {
  for (let queryIndex = 0; queryIndex < queryLists.length; queryIndex += 1) {
    if (!queryLists[queryIndex].includes(phrase)) {
      return false;
    }
  }
  return true;
};

export default existsInAll;
