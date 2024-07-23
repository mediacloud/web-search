import { decode, handleDecode } from './setSearchQuery';

const decodeSavedSearch = (url) => {
  const [, fullquery] = url.split('?');
  const parameter = url.split('?')[1].split('=')[0];
  const advanced = parameter === 'qs';

  let query = fullquery.split('&')[0].split('=')[1];
  query = decode(query);

  let negatedQuery = fullquery.split('=')[2].split('&')[0];
  negatedQuery = decode(negatedQuery);

  let start = fullquery.split('=')[3].split('&')[0];
  start = start ? handleDecode(start).join(',') : null;

  let end = fullquery.split('=')[4].split('&')[0];
  end = end ? handleDecode(end).join(',') : null;

  let platforms = fullquery.split('=')[5].split('&')[0];
  platforms = platforms ? handleDecode(platforms).join(',') : null;

  let sources = fullquery.split('=')[6].split('&')[0];
  sources = decode(sources);

  let collections = fullquery.split('=')[7].split('&')[0];
  collections = decode(collections);

  let anyAlls = fullquery.split('=')[8].split('&')[0];
  anyAlls = handleDecode(anyAlls).join(',');

  let names = fullquery.split('=')[9].split('&')[0];
  names = handleDecode(names).join(', ');

  let edited = fullquery.split('=')[10].split('&')[0];
  edited = handleDecode(edited).join(',');

  return {
    queryStrings: '',
    query,
    negatedQuery,
    platforms,
    startDates: start,
    endDates: end,
    collections,
    previewCollections: collections,
    sources,
    previewSources: sources,
    anyAlls,
    advanced,
    names,
    edited,
  };
};

export default decodeSavedSearch;
