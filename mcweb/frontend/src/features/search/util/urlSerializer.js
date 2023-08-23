import dayjs from 'dayjs';

const formatCollections = (collectionsArray) => collectionsArray.map((collection) => (
  collection
));

const formatSources = (sourcesArray) => sourcesArray.map((source) => (
  source
));

const queryListHelper = (queryList) => {
  const filtered = queryList ? queryList.filter((queryPhrase) => queryPhrase.length >= 1) : [];
  return filtered.join(',');
};

const encode = (param) => (encodeURIComponent(param));

const urlSerializer = (queryState) => {
  const queries = [];
  const negatedQueries = [];
  const queryStrings = [];
  const starts = [];
  const ends = [];
  const platforms = [];
  const sourceArr = [];
  const collectionArr = [];
  const anys = [];
  const adv = [];
  const names = [];
  const edits = [];
  queryState.forEach((queryObject) => {
    const {
      queryString,
      queryList,
      negatedQueryList,
      startDate,
      endDate,
      collections,
      sources,
      platform,
      anyAll,
      advanced,
      name,
      edited,
    } = queryObject;

    const query = queryListHelper(queryList);
    queries.push([encode(query)]);

    const negatedQuery = queryListHelper(negatedQueryList);
    negatedQueries.push([encode(negatedQuery)]);

    queryStrings.push(encode(queryString));

    starts.push(dayjs(startDate).format('MM-DD-YYYY'));
    ends.push(dayjs(endDate).format('MM-DD-YYYY'));

    platforms.push(platform);
    const collectionsFormatted = formatCollections(collections).join(',');
    collectionArr.push([encode(collectionsFormatted)]);

    const sourcesFormatted = sources ? formatSources(sources).join(',') : [];
    sourceArr.push([encode(sourcesFormatted)]);

    anys.push(anyAll);
    adv.push(advanced);
    names.push(name);
    edits.push(edited);
  });

  if (adv[0]) {
    return `qs=${encode(queryStrings)}&start=${encode(starts)}&end=${encode(ends)}'
    + '&p=${encode(platforms)}&ss=${encode(sourceArr)}&cs=${encode(collectionArr)}'
    + '&any=${encode(anys)}&name=${encode(names)}&edit=${encode(edits)}`;
  }

  return `q=${encode(queries)}&nq=${encode(negatedQueries)}&start=${encode(starts)}`
    + `&end=${encode(ends)}&p=${encode(platforms)}&ss=${encode(sourceArr)}`
    + `&cs=${encode(collectionArr)}&any=${encode(anys)}&name=${encode(names)}&edit=${encode(edits)}`;
};

export default urlSerializer;
