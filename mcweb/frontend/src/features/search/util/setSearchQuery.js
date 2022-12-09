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
  setAdvanced,
  setQueryString,
  setSearchTime,
} from '../query/querySlice';

const customParseFormat = require('dayjs/plugin/customParseFormat');

const formatQuery = (query) => {
  if (query === null) return null;
  const finalQuery = new Array(query.length);
  for (let i = 0; i < query.length; i += 1) {
    finalQuery[i] = query[i];
  }
  return finalQuery;
};

const decode = (params) => decodeURIComponent(params);

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
  let [id, name] = collection.split('>');
  id = Number(id);
  return { id, name, type: 'collection' };
});

const formatSources = (sources) => sources.map((source) => {
  let [id, name] = source.split('>');
  id = Number(id);
  return { id, name, type: 'source' };
});

const setSearchQuery = (searchParams, dispatch) => {
  dayjs.extend(customParseFormat);
  // param keys are set in ./urlSerializer.js
  let query = searchParams.get('q');
  let negatedQuery = searchParams.get('nq');
  let startDate = searchParams.get('start');
  let endDate = searchParams.get('end');
  const platform = searchParams.get('p');
  let collections = searchParams.get('cs');
  let sources = searchParams.get('ss');
  const anyAll = searchParams.get('any');
  let queryString = searchParams.get('qs');

  query = query ? decode(query).split(',') : null;
  query = formatQuery(query);
  query = sizeQuery(query);

  negatedQuery = negatedQuery ? decode(negatedQuery).split(',') : null;
  negatedQuery = formatQuery(negatedQuery);
  negatedQuery = sizeQuery(negatedQuery);

  queryString = queryString ? decode(queryString) : null;

  startDate = startDate ? dayjs(startDate, 'MM/DD/YYYY').format('MM/DD/YYYY') : null;
  endDate = endDate ? dayjs(endDate, 'MM/DD/YYYY').format('MM/DD/YYYY') : null;
  collections = collections ? decode(collections).split(',') : [];
  collections = formatCollections(collections);
  sources = sources ? decode(sources).split(',') : [];
  sources = formatSources(sources);

  if (queryString) {
    dispatch(setQueryString(queryString));
    dispatch(setAdvanced(true));
  } else {
    dispatch(setQueryList(query));
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

  dispatch(addSelectedMedia(collections.concat(sources)));
  dispatch(setPreviewSelectedMedia(collections.concat(sources)));

  dispatch(setSearchTime(dayjs().unix()));
  return null;
};

export default setSearchQuery;
