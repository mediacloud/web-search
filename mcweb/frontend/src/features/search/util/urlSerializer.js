import dayjs from 'dayjs';

<<<<<<< HEAD
// const collectionIds = (collections) => collections.map(collection => collection['id']);

const formatCollections = (collectionsArray) => {
  return collectionsArray.map(collection => (
    `${collection.id}>${collection.name}`
  ));
};
=======
const collectionIds = (collections) => collections.map((collection) => collection.id);
>>>>>>> main

const queryListHelper = (queryList) => {
  if (queryList[0].length < 1) return '';
  const filtered = queryList.filter((queryWord) => queryWord.length >= 1);
  return filtered.join(',');
};
const urlSerializer = (queryObject) => {
<<<<<<< HEAD
    const {
        queryList, 
        negatedQueryList, 
        startDate, 
        endDate, 
        collections, 
        platform, 
        anyAll } = queryObject;
    const query = queryListHelper(queryList);
    const negatedQuery = queryListHelper(negatedQueryList);
    const start = dayjs(startDate).format('MM-DD-YYYY');
    const end = dayjs(endDate).format('MM-DD-YYYY');
    const collectionsFormatted = formatCollections(collections).join(",");
    // const collectionsIds = collectionIds(collections).join(',');
    console.log(collectionsFormatted);
    return `?query=${query}&negatedQuery=${negatedQuery}&startDate=${start}&endDate=${end}&platform=${platform}&collections=${collectionsFormatted}&anyAll=${anyAll}`;
=======
  const {
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    collections,
    platform,
    anyAll,
  } = queryObject;
  const query = queryListHelper(queryList);
  const negatedQuery = queryListHelper(negatedQueryList);
  const start = dayjs(startDate).format('MM-DD-YYYY');
  const end = dayjs(endDate).format('MM-DD-YYYY');
  const collectionId = collectionIds(collections).join(',');
  return `?query=${query}&negatedQuery=${negatedQuery}&startDate=${start}&endDate=${end}&platform=${platform}&collections=${collectionId}&anyAll=${anyAll}`;
>>>>>>> main
};

export default urlSerializer;
