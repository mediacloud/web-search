import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';
import queryGenerator from './queryGenerator';
import compareArrays from './compareArrays';
import allDuplicates from './tabTitleHelpers/allDuplicates';
import collectionTitle from './tabTitleHelpers/collectionTitle';
import simplifyTitles from './tabTitleHelpers/simplifyTitles';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  // advanced mode
  if (queryString) return queryString;

  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

const tabTitle = (queryList, negatedQueryList, anyAll, queryString, collectionNames, index, queryState) => {
  if (queryState) {
    // eslint-disable-next-line max-len
    const titles = queryState.map((query) => createTitle(query.queryList, query.negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, query.anyAll, query.queryString));
    const anyAlls = queryState.map((q) => q.anyAll);
    const simplifedTitles = simplifyTitles(titles, anyAlls);

    // one tab
    if (queryState.length === 1) return titles[index];

    // titles and collections are duplicates
    if (allDuplicates(titles) && allDuplicates(collectionNames, compareArrays)) return `Query ${index + 1} `;

    // titles are duplicates
    if (allDuplicates(titles)) return collectionTitle(collectionNames[index]);

    return simplifedTitles[index];
  }

  // queryState isn't passed in (setSearchQuery)
  const title = createTitle(queryList, negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, anyAll, queryString);
  if (title === '*') return `Query ${index + 1} `;
  if (title.length > 20) return `${title.substring(0, 20)} ...`;
  return title;
};

export default tabTitle;
