import dayjs from 'dayjs';

const formatCollections = (collectionsArray) => collectionsArray.map((collection) => (
  `${collection.id}>${collection.name}`
));

const queryListHelper = (queryList) => {
  const filtered = queryList.filter((queryPhrase) => queryPhrase.length >= 1);
  return filtered.join(',');
};

const encode = (param) => (encodeURIComponent(param));

const urlSerializer = (queryObject) => {
  const {
    queryString,
    queryList,
    negatedQueryList,
    startDate,
    endDate,
    collections,
    platform,
    anyAll,
    advanced,
  } = queryObject;

  let query = queryListHelper(queryList);
  query = encode(query);

  let negatedQuery = queryListHelper(negatedQueryList);
  negatedQuery = encode(negatedQuery);

  const qs = encode(queryString);

  const start = dayjs(startDate).format('MM-DD-YYYY');
  const end = dayjs(endDate).format('MM-DD-YYYY');
  let collectionsFormatted = formatCollections(collections).join(',');
  collectionsFormatted = encode(collectionsFormatted);

  if (advanced) {
    return `?qs=${qs}&start=${start}&end=${end}&p=${platform}&cs=${collectionsFormatted}&any=${anyAll}`;
  }
  return `?q=${query}&nq=${negatedQuery}&start=${start}&end=${end}&p=${platform}&cs=${collectionsFormatted}&any=${anyAll}`;
};

export default urlSerializer;
