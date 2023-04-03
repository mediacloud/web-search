import dayjs from 'dayjs';

import {
  setQueryProperty,
  addSelectedMedia,
  setPreviewSelectedMedia,
} from '../query/querySlice';

const customParseFormat = require('dayjs/plugin/customParseFormat');

const decode = (params) => decodeURIComponent(params);

const formatQuery = (queries) => {
  if (queries === null) return null;
  // console.log(query);
  const finalQuery = new Array(queries.length);
  queries.forEach((query, i) => {
    const decoded = decode([query]);
    finalQuery[i] = [decoded];
  });
  // console.log(finalQuery);
  // for (let i = 0; i < query.length; i += 1) {
  //   finalQuery[i] = query[i];
  // }
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
  let [id, name] = collection.split('>');
  id = Number(id);
  return { id, name, type: 'collection' };
});

const formatSources = (sources) => sources.map((source) => {
  let [id, name] = source.split('>');
  id = Number(id);
  return { id, name, type: 'source' };
});

const handleDecode = (param) => {
  const decoded = decode(param);
  const split = decoded.split(',');
  return split;
};

const handleDateFormat = (datesArray) => datesArray.map((dateString) => (
  dayjs(dateString, 'MM/DD/YYYY').format('MM/DD/YYYY')
));

const setSearchQuery = (searchParams, dispatch) => {
  dayjs.extend(customParseFormat);
  const queryIndex = 0;
  // param keys are set in ./urlSerializer.js
  let query = searchParams.get('q');
  let negatedQuery = searchParams.get('nq');
  let startDates = searchParams.get('start');
  let endDates = searchParams.get('end');
  const platform = searchParams.get('p');
  let collections = searchParams.get('cs');
  let sources = searchParams.get('ss');
  const anyAll = searchParams.get('any');
  let queryString = searchParams.get('qs');

  query = query ? query.split(',') : null;
  query = formatQuery(query);
  // query = sizeQuery(query); << needs to be used in final setting of state

  negatedQuery = negatedQuery ? negatedQuery.split(',') : null;
  negatedQuery = formatQuery(negatedQuery);
  // negatedQuery = sizeQuery(negatedQuery);

  queryString = queryString ? decode(queryString) : null; // come back to

  startDates = startDates ? handleDecode(startDates) : null;

  startDates = handleDateFormat(startDates);

  endDates = endDates ? handleDecode(endDates) : null;
  endDates = handleDateFormat(endDates);

  collections = collections ? collections.split(',') : [];
  console.log(collections);
  // collections = formatCollections(collections);
  // console.log(collections);
  sources = sources ? sources.split(',') : [];
  sources = formatSources(sources);
  // console.log(sources);
  // if (queryString) {
  //   dispatch(setQueryProperty({ queryString, queryIndex, property: 'queryString' }));
  //   dispatch(setQueryProperty({ advanced: true, queryIndex, property: 'advanced' }));
  // } else {
  //   dispatch(setQueryProperty({ queryList: query, queryIndex, property: 'queryList' }));
  //   dispatch(setQueryProperty({ negatedQueryList: negatedQuery, queryIndex, property: 'negatedQueryList' }));
  // }
  // if (startDate) {
  //   dispatch(setQueryProperty({ startDate, queryIndex, property: 'startDate' }));
  // }
  // if (endDate) {
  //   dispatch(setQueryProperty({ endDate, queryIndex, property: 'endDate' }));
  // }
  // if (platform) {
  //   dispatch(setQueryProperty({ platform, queryIndex, property: 'platform' }));
  // }
  // if (anyAll) {
  //   dispatch(setQueryProperty({ anyAll, queryIndex, property: 'anyAll' }));
  // }

  // dispatch(addSelectedMedia({ sourceOrCollection: collections.concat(sources), queryIndex }));
  // dispatch(setPreviewSelectedMedia({ sourceOrCollection: collections.concat(sources), queryIndex }));

  // dispatch(setQueryProperty({ lastSearchTime: dayjs().unix(), queryIndex, property: 'lastSearchTime' }));

  return null;
};

export default setSearchQuery;
