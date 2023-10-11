export const PARTISAN = 'partisan';
export const GLOBAL = 'global';
export const REGIONAL = 'regional';

const partisanCollections = [200363061, 200363048, 200363050, 200363062, 200363049];
const partisanCollectionsNames = ['left', 'center left', 'center', 'center right', 'right'];
const globalCollections = [34412234, 34412476, 38376341, 34412356, 34412409, 34412146, 34412257, 34412118];
const globalCollectionsNames = ['united states', 'united kingdom', 'nigeria', 'spain', 'germany', 'france', 'brazil', 'india'];
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
