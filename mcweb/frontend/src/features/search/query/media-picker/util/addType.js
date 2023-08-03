const addType = (pS, pC) => {
  const sourceTypes = pS.map((s) => ({
    id: s,
    type: 'source',
  }));
  const collectionTypes = pC.map((c) => ({
    id: c,
    type: 'collection',
  }));
  return [...sourceTypes, ...collectionTypes];
};

export default addType;
