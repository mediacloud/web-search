import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import {
  setQueryList,
  setNegatedQueryList,
  setStartDate,
  setEndDate,
  setPlatform,
  setAnyAll,
  addSelectedMedia,
  setPreviewSelectedMedia,
} from '../query/querySlice';

const setCharAt = (str, index, chr) => {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
};

const hashReplace = (w) => {
  const hashPos = w.indexOf('^');
  if (hashPos !== -1) {
    w = setCharAt(w, hashPos, '#');
  }
  return w;
};

const formatQuery = (query) => {
  if (query === null) return null;
  const finalQuery = new Array(query.length);
  for (let i = 0; i < query.length; i += 1) {
    finalQuery[i] = query[i];
  }
  return finalQuery;
};

// if query length is less than 3 (default size for search) make length 3
const sizeQuery = (query) => {
  if (!query) return [[], [], []];
  if (query.length >= 3) return query;
  if (query.length === 2) {
    query.push([]);
  }
  if (query.length === 1) {
    query.push([], []);
  }
  return query;
};

const formatCollections = (collections) => collections.map((collection) => {
  const [id, name] = collection.split('>');
  return { id, name };
});

const setSearchQuery = (searchParams) => {
  const dispatch = useDispatch();
  let query = searchParams.get('query');
  let negatedQuery = searchParams.get('negatedQuery');
  let startDate = searchParams.get('startDate');
  let endDate = searchParams.get('endDate');
  const platform = searchParams.get('platform');
  let collections = searchParams.get('collections');
  const anyAll = searchParams.get('anyAll');

  query = query ? query.split(',') : null;
  query = formatQuery(query);
  query = sizeQuery(query).map(hashReplace);

  negatedQuery = negatedQuery ? negatedQuery.split(',') : null;
  negatedQuery = formatQuery(negatedQuery);
  negatedQuery = sizeQuery(negatedQuery).map(hashReplace);

  startDate = startDate ? dayjs(startDate).format('MM/DD/YYYY') : null;
  endDate = endDate ? dayjs(endDate).format('MM/DD/YYYY') : null;

  collections = collections ? collections.split(',') : null;
  collections = formatCollections(collections);

  if (query) {
    dispatch(setQueryList(query));
  }
  if (negatedQuery) {
    dispatch(setNegatedQueryList(negatedQuery));
  }
  if (startDate) {
    dispatch(setStartDate(startDate));
  }
  if (endDate) {
    dispatch(setEndDate(endDate));
  }
  if (platform) {
    dispatch(setPlatform(platform));
  }
  if (anyAll) {
    dispatch(setAnyAll(anyAll));
  }
  if (collections) {
    dispatch(addSelectedMedia(collections));
    dispatch(setPreviewSelectedMedia(collections));
  }

  return null;
};

export default setSearchQuery;
