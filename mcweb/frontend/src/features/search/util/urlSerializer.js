import dayjs from 'dayjs';

// const collectionIds = (collections) => collections.map(collection => collection['id']);

const formatCollections = (collectionsArray) => collectionsArray.map((collection) => (
  `${collection.id}>${collection.name}`
));

// const hashReplace = (w) => {
//   const hashPos = w.indexOf('#');
//   if (hashPos !== -1) {
//     w[hashPos] = '^';
//   }
//   console.log(w);
//   return w;
// };

const queryListHelper = (queryList) => {
  if (queryList[0].length < 1) return '';
  const filtered = queryList.filter((queryWord) => queryWord.length >= 1);
  // filtered = filtered.map(hashReplace);
  // console.log(filtered);
  return filtered.join(',');
};
const urlSerializer = (queryObject) => {
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
  // console.log(query);
  const negatedQuery = queryListHelper(negatedQueryList);
  const start = dayjs(startDate).format('MM-DD-YYYY');
  const end = dayjs(endDate).format('MM-DD-YYYY');
  const collectionsFormatted = formatCollections(collections).join(',');
  return `?query=${query}&negatedQuery=${negatedQuery}&startDate=${start}&endDate=${end}&platform=${platform}&collections=${collectionsFormatted}&anyAll=${anyAll}`;
};

export default urlSerializer;
