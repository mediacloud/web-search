import dayjs from 'dayjs';
import {
  setQueryProperty,
  setPreviewSelectedMedia,
  addQuery,
  setPlatform,
  setLastSearchTime,
  setSelectedMedia,
} from '../query/querySlice';

const customParseFormat = require('dayjs/plugin/customParseFormat');

export const decode = (params) => decodeURIComponent(params);

export const handleDecode = (param) => {
  const decoded = decode(param);
  const split = decoded.split(',');
  return split;
};

export const formatQuery = (queries) => {
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
export const sizeQuery = (queryArray) => queryArray.map((query) => {
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

export const combineQueryMedia = (cs, ss) => {
  const queryLength = cs.length === 0 ? ss.length : cs.length;
  const mediaArr = new Array(queryLength);

  if (cs.length === 0) mediaArr[0] = [];
  cs.forEach((c, i) => {
    if (c[0].id === 0) {
      mediaArr[i] = [];
    } else {
      mediaArr[i] = c;
    }
  });
  ss.forEach((s, i) => {
    if (s[0].id !== 0) {
      mediaArr[i].push(...s);
    }
  });

  return mediaArr;
};

export const decodeAndFormatCorpus = (mediaArray, collectionBool) => {
  const returnArr = new Array(mediaArray.length);

  mediaArray.forEach((queryCorpus, i) => {
    const decoded = handleDecode([queryCorpus]);
    const numbered = decoded.map((collectionId) => ({
      id: Number(collectionId), type: collectionBool ? 'collection' : 'source',
    }));
    returnArr[i] = numbered;
  });
  return returnArr;
};

export const handleDateFormat = (datesArray) => datesArray.map((dateString) => (
  dayjs(dateString, 'MM/DD/YYYY').format('MM/DD/YYYY')
));

export const setQueryState = (
  queries,
  negatedQueries,
  queryStrings,
  startDates,
  endDates,
  platforms,
  media,
  anyAlls,
  dispatch,
) => {
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

  dispatch(setPreviewSelectedMedia({ sourceOrCollection: media }));
  dispatch(setSelectedMedia({ sourceOrCollection: media }));

  dispatch(setLastSearchTime(dayjs().unix()));
};

const queryArrayFromSearchParams = (searchParams) => {
  const query = searchParams.get('q');
  const negatedQuery = searchParams.get('nq');
  const startDates = searchParams.get('start');
  const endDates = searchParams.get('end');
  const platforms = searchParams.get('p');
  const collections = searchParams.get('cs');
  const sources = searchParams.get('ss');
  const anyAlls = searchParams.get('any');
  const queryStrings = searchParams.get('qs');

  return {
    query,
    negatedQuery,
    startDates,
    endDates,
    platforms,
    collections,
    sources,
    anyAlls,
    queryStrings,
  };
};

export const setSearchQuery = (searchParams, dispatch, savedSearchBool) => {
  dayjs.extend(customParseFormat);
  // param keys are set in ./urlSerializer.js
  const queriesObject = savedSearchBool ? searchParams : queryArrayFromSearchParams(searchParams);
  console.log(queriesObject, 'IN SET SEARCH', savedSearchBool);
  let {
    query,
    negatedQuery,
    startDates,
    endDates,
    platforms,
    collections,
    sources,
    anyAlls,
    queryStrings,
  } = queriesObject;
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
  collections = decodeAndFormatCorpus(collections, true);

  sources = sources ? sources.split(',') : [];
  sources = decodeAndFormatCorpus(sources, false);

  const media = combineQueryMedia(collections, sources);
  anyAlls = anyAlls ? handleDecode(anyAlls) : null;
  setQueryState(query, negatedQuery, queryStrings, startDates, endDates, platforms, media, anyAlls, dispatch);

  return null;
};
