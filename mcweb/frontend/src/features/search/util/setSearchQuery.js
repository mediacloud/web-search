import dayjs from 'dayjs';
import {
  setQueryProperty,
  addSelectedMedia,
  setPreviewSelectedMedia,
  addQuery,
  setPlatform,
  setLastSearchTime,
  resetSelectedAndPreviewMedia,
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

const decodeAndFormatCorpus = (mediaArray) => {
  const returnArr = new Array(mediaArray.length);

  mediaArray.forEach((queryCorpus, i) => {
    const decoded = handleDecode([queryCorpus]);
    const numbered = decoded.map((collectionId) => Number(collectionId));
    returnArr[i] = numbered;
  });
  return returnArr;
};

const handleDateFormat = (datesArray) => datesArray.map((dateString) => (
  dayjs(dateString, 'MM/DD/YYYY').format('MM/DD/YYYY')
));

const setState = (queries, negatedQueries, queryStrings, startDates, endDates, platforms, collections, sources, anyAlls, dispatch) => {
  if (!queries) {
    queryStrings.forEach((queryString, i) => {
      if (i === 0) {
        dispatch(setPlatform(platforms[i]));
        dispatch(setQueryProperty({ advanced: true, queryIndex: i, property: 'advanced' }));
        dispatch(setQueryProperty({ queryString, queryIndex: i, property: 'queryString' }));
      } else if (queryString) {
        dispatch(addQuery(platforms[0]));
        dispatch(setQueryProperty({ advanced: true, queryIndex: i, property: 'advanced' }));
        dispatch(setQueryProperty({ queryString, queryIndex: i, property: 'queryString' }));
      }
    });
  } else {
    queries.forEach((query, i) => {
      if (i === 0) {
        dispatch(setPlatform(platforms[i]));
        dispatch(setQueryProperty({ queryList: query, queryIndex: i, property: 'queryList' }));
      } else {
        dispatch(addQuery(platforms[0]));
        dispatch(setQueryProperty({ queryList: query, queryIndex: i, property: 'queryList' }));
      }
    });
    if (negatedQueries) {
      negatedQueries.forEach((negatedQuery, i) => {
        dispatch(setQueryProperty({ negatedQuery, queryIndex: i, property: 'negatedQuery' }));
      });
    }
  }

  startDates.forEach((startDate, i) => {
    dispatch(setQueryProperty({ startDate, queryIndex: i, property: 'startDate' }));
  });
  endDates.forEach((endDate, i) => {
    dispatch(setQueryProperty({ endDate, queryIndex: i, property: 'endDate' }));
  });
  anyAlls.forEach((anyAll, i) => {
    dispatch(setQueryProperty({ anyAll, queryIndex: i, property: 'anyAll' }));
  });

  let reset;
  sources.forEach((source, i) => {
    // if (source[0] === null) {
    //   reset = true;
    //   return null;
    // }
    console.log('source', source);
    dispatch(setPreviewSelectedMedia({ sourceOrCollection: [...source], queryIndex: i, collectionBool: false }));
    dispatch(addSelectedMedia({ sourceOrCollection: [...source], queryIndex: i, collectionBool: false }));
    // reset = false;
  });
  collections.forEach((collectionList, i) => {
    // if (collection[0] === null) {
    //   // reset = true;
    //   return null;
    // }
    dispatch(setPreviewSelectedMedia({ sourceOrCollection: [...collectionList], queryIndex: i, collectionBool: true }));
    dispatch(addSelectedMedia({ sourceOrCollection: [...collectionList], queryIndex: i, collectionBool: true }));
    // reset = false;
  });
  if (reset) {
    for (let i = 0; i < collections.length; i += 1) {
      dispatch(resetSelectedAndPreviewMedia({ queryIndex: i }));
    }
  }
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
  let queryStrings = searchParams.get('qs');

  query = query ? query.split(',') : null;
  query = formatQuery(query);
  query = query ? sizeQuery(query) : null;

  negatedQuery = negatedQuery ? negatedQuery.split(',') : null;
  negatedQuery = formatQuery(negatedQuery);
  negatedQuery = negatedQuery ? sizeQuery(negatedQuery) : null;

  queryStrings = queryStrings ? handleDecode(queryStrings) : null; // come back to

  startDates = startDates ? handleDecode(startDates) : null;

  startDates = handleDateFormat(startDates);

  endDates = endDates ? handleDecode(endDates) : null;
  endDates = handleDateFormat(endDates);

  platforms = platforms ? handleDecode(platforms) : null;

  collections = collections ? collections.split(',') : [];
  collections = decodeAndFormatCorpus(collections);
  console.log('decodedC', collections);

  sources = sources ? handleDecode(sources) : [];
  sources = decodeAndFormatCorpus(sources);
  console.log('decodedSource', sources);
  // sources = decodeAndFormatCorpus(sources, false);

  anyAlls = anyAlls ? handleDecode(anyAlls) : null;
  setState(query, negatedQuery, queryStrings, startDates, endDates, platforms, collections, sources, anyAlls, dispatch);

  return null;
};

export default setSearchQuery;
