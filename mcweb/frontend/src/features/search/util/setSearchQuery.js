import dayjs from 'dayjs';
import {
  setQueryProperty,
  addSelectedMedia,
  setPreviewSelectedMedia,
  addQuery,
  setPlatform,
  setLastSearchTime,

} from '../query/querySlice';

const customParseFormat = require('dayjs/plugin/customParseFormat');

const decode = (params) => decodeURIComponent(params);

const handleDecode = (param) => {
  const decoded = decode(param);
  const split = decoded.split(',');
  return split;
};

const formatQuery = (queries) => {
  if (queries === null) return null;
  const finalQuery = new Array(queries.length);
  queries.forEach((query, i) => {
    const decoded = handleDecode([query]);
    decoded[0] = decoded[0] === '' ? [] : decoded[0];
    finalQuery[i] = decoded;
  });
  return finalQuery;
};

// if query length is less than 3 (default size for search) make length 3
const sizeQuery = (queryArray) => queryArray.map((query) => {
  if (!query) return [[], [], []];
  if (query.length >= 3) return query;
  if (query.length === 2) {
    query.push([]);
  }
  if (query.length === 1) {
    query.push([], []);
  }
  return query;
});

const formatCorpus = (collections, collectionBool) => collections.map((collection) => {
  if (collection === '' || collection.length === 0) return null;
  let [id, name] = collection.split('>');
  id = Number(id);
  return { id, name, type: collectionBool ? 'collection' : 'source' };
});

const decodeAndFormatCorpus = (mediaArray, collectionBool) => {
  const returnArr = new Array(mediaArray.length);
  mediaArray.forEach((queryCorpus, i) => {
    const decoded = handleDecode([queryCorpus]);
    const formatted = formatCorpus(decoded, collectionBool);
    if (formatted) {
      returnArr[i] = formatted;
    }
  });
  return returnArr;
};

const handleDateFormat = (datesArray) => datesArray.map((dateString) => (
  dayjs(dateString, 'MM/DD/YYYY').format('MM/DD/YYYY')
));

const setState = (queries, negatedQueries, startDates, endDates, platforms, collections, sources, anyAlls, dispatch) => {
  queries.forEach((query, i) => {
    if (i === 0) {
      dispatch(setPlatform(platforms[i]));
      dispatch(setQueryProperty({ queryList: query, queryIndex: i, property: 'queryList' }));
    } else {
      dispatch(addQuery(platforms[0]));
      dispatch(setQueryProperty({ queryList: query, queryIndex: i, property: 'queryList' }));
    }
  });
  negatedQueries.forEach((negatedQuery, i) => {
    dispatch(setQueryProperty({ negatedQuery, queryIndex: i, property: 'negatedQuery' }));
  });

  startDates.forEach((startDate, i) => {
    dispatch(setQueryProperty({ startDate, queryIndex: i, property: 'startDate' }));
  });
  endDates.forEach((endDate, i) => {
    dispatch(setQueryProperty({ endDate, queryIndex: i, property: 'endDate' }));
  });
  anyAlls.forEach((anyAll, i) => {
    dispatch(setQueryProperty({ anyAll, queryIndex: i, property: 'anyAll' }));
  });
  sources.forEach((source, i) => {
    if (source[0] === null) return null;
    dispatch(setPreviewSelectedMedia({ sourceOrCollection: [...source], queryIndex: i }));
    dispatch(addSelectedMedia({ sourceOrCollection: [...source], queryIndex: i }));
  });
  collections.forEach((collection, i) => {
    if (collection[0] === null) return null;
    dispatch(setPreviewSelectedMedia({ sourceOrCollection: [...collection], queryIndex: i }));
    dispatch(addSelectedMedia({ sourceOrCollection: [...collection], queryIndex: i }));
  });
  dispatch(setLastSearchTime(dayjs().unix()));
};

const setSearchQuery = (searchParams, dispatch) => {
  dayjs.extend(customParseFormat);
  // param keys are set in ./urlSerializer.js
  let query = searchParams.get('q');
  let negatedQuery = searchParams.get('nq');
  let startDates = searchParams.get('start');
  let endDates = searchParams.get('end');
  let platforms = searchParams.get('p');
  let collections = searchParams.get('cs');
  let sources = searchParams.get('ss');
  let anyAlls = searchParams.get('any');
  // const queryString = searchParams.get('qs');

  query = query ? query.split(',') : null;
  query = formatQuery(query);
  query = sizeQuery(query);

  negatedQuery = negatedQuery ? negatedQuery.split(',') : null;
  negatedQuery = formatQuery(negatedQuery);
  negatedQuery = negatedQuery ? sizeQuery(negatedQuery) : sizeQuery([[]]);

  // queryString = queryString ? handleDecode(queryString) : null; // come back to

  startDates = startDates ? handleDecode(startDates) : null;

  startDates = handleDateFormat(startDates);

  endDates = endDates ? handleDecode(endDates) : null;
  endDates = handleDateFormat(endDates);

  platforms = platforms ? handleDecode(platforms) : null;

  collections = collections ? collections.split(',') : [];
  collections = decodeAndFormatCorpus(collections, true);

  sources = sources ? sources.split(',') : [];
  sources = decodeAndFormatCorpus(sources, false);

  anyAlls = anyAlls ? handleDecode(anyAlls) : null;
  setState(query, negatedQuery, startDates, endDates, platforms, collections, sources, anyAlls, dispatch);

  return null;
};

export default setSearchQuery;
