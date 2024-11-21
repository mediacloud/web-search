export const PARTISAN = 'partisan';
export const GLOBAL = 'global';
export const REGIONAL = 'regional';

const partisanCollections = [231013063, 231013089, 231013108, 231013109, 231013110];
const partisanCollectionsNames = ['left', 'center left', 'center', 'center right', 'right'];
const globalCollections = [34412234, 34412476, 34412118, 34412282, 34412126, 34412313, 34412238];
const globalCollectionsNames = ['united states', 'united kingdom', 'india', 'australia', 'kenya', 'philippines', 'south africa'];
const regionalCollections = [];
const regionalCollectionsNames = [];

const getCollections = (type) => {
  if (type === PARTISAN) {
    return partisanCollections;
  }
  if (type === GLOBAL) {
    return globalCollections;
  }
  if (type === REGIONAL) {
    return regionalCollections;
  }
  return false;
};

const getQueryNames = (type) => {
  if (type === PARTISAN) {
    return partisanCollectionsNames;
  }
  if (type === GLOBAL) {
    return globalCollectionsNames;
  }
  if (type === REGIONAL) {
    return regionalCollectionsNames;
  }
  return false;
};

export const generateComparativeQuery = (type, queryObject) => {
  const comparativeCollections = getCollections(type);
  const comparativeQueryNames = getQueryNames(type);
  const returnArr = new Array(comparativeCollections.length);
  const {
    queryString,
    queryList,
    negatedQueryList,
    platform,
    startDate,
    endDate,
    isFromDateValid,
    isToDateValid,
    anyAll,
    advanced,
    lastSearchTime,
  } = queryObject;

  comparativeCollections.forEach((collection, i) => {
    returnArr[i] = {
      queryString,
      queryList,
      negatedQueryList,
      platform,
      startDate,
      endDate,
      collections: [collection],
      previewCollections: [],
      sources: [],
      previewSources: [],
      lastSearchTime,
      isFromDateValid,
      isToDateValid,
      anyAll,
      advanced,
      name: comparativeQueryNames[i],
      edited: true,
    };
  });
  return returnArr;
};
