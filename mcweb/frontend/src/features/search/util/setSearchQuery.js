import dayjs from 'dayjs';
import {
  setQueryProperty,
  setPreviewSelectedMedia,
  addQuery,
  setPlatform,
  setLastSearchTime,
  setSelectedMedia,
} from '../query/querySlice';

import tabTitle from './tabTitles';

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

const combineQueryMedia = (cs, ss) => {
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

const decodeAndFormatCorpus = (mediaArray, collectionBool) => {
  const returnArr = new Array(mediaArray.length);
  mediaArray.forEach((queryCorpus, i) => {
    const decoded = handleDecode([queryCorpus]);
    const numbered = decoded.map((collectionId) => {
      let numberId = Number(collectionId);

      if (Number.isNaN(numberId)) {
        const [id] = collectionId.split('>');
        numberId = id;
      }

      return {
        id: numberId, type: collectionBool ? 'collection' : 'source',
      };
    });
    returnArr[i] = numbered;
  });
  return returnArr;
};

const handleDateFormat = (datesArray) => datesArray.map((dateString) => (
  dayjs(dateString, 'MM/DD/YYYY').format('MM/DD/YYYY')
));

const setState = (
  queries,
  negatedQueries,
  queryStrings,
  startDates,
  endDates,
  platforms,
  media,
  anyAlls,
  names,
  edited,
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
        dispatch(setQueryProperty({ negatedQueryList: negatedQuery, queryIndex: i, property: 'negatedQueryList' }));
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

  edited.forEach((edit, i) => {
    dispatch(setQueryProperty({ edited: edit === 'true', queryIndex: i, property: 'edited' }));
  });

  dispatch(setPreviewSelectedMedia({ sourceOrCollection: media }));
  dispatch(setSelectedMedia({ sourceOrCollection: media }));
  dispatch(setLastSearchTime(dayjs().unix()));

  anyAlls.forEach((anyAll, i) => {
    dispatch(setQueryProperty({ anyAll, queryIndex: i, property: 'anyAll' }));
  });
  console.log(names);
  console.log(edited);
  names.forEach((title, i) => {
    // name is not flagged
    if (edited[i] === 'false') {
      if (negatedQueries) {
        dispatch(setQueryProperty(
          {
            name: tabTitle(queries[i], negatedQueries[i], anyAlls[i], queryStrings, i),
            queryIndex: i,
            property: 'name',
          },
        ));
      } else {
        dispatch(setQueryProperty(
          {
            name: tabTitle(queries[i], [], anyAlls[i], queryStrings, i),
            queryIndex: i,
            property: 'name',
          },
        ));
      }
    } else { // item is flagged
      dispatch(setQueryProperty(
        {
          name: title,
          queryIndex: i,
          property: 'name',
        },
      ));
    }
  });
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
  let names = searchParams.get('name');
  let edited = searchParams.get('edit');

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

  names = names ? handleDecode(names) : null;

  edited = edited ? handleDecode(edited) : null;

  setState(query, negatedQuery, queryStrings, startDates, endDates, platforms, media, anyAlls, names, edited, dispatch);

  return null;
};

export default setSearchQuery;
