import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';
import queryGenerator from './queryGenerator';
import compareArrays from './compareArrays';
import allDuplicates from './tabTitleHelpers/allDuplicates';
import collectionTitle from './tabTitleHelpers/collectionTitle';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  if (queryString) return queryString;
  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

const tabTitle2 = (queryList, negatedQueryList, anyAll, queryString, index, queryState, collectionNames) => {
  if (queryState) {
    // eslint-disable-next-line max-len
    const titles = queryState.map((query) => createTitle(query.queryList, query.negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, query.anyAll, query.queryString));
    if (queryState.length === 1) return titles[index];

    // titles are duplicates
    if (allDuplicates(titles)) {
      // collectionNames are duplicates
      if (allDuplicates(collectionNames, compareArrays)) {
        return `Query ${index + 1} `;
      }
      // use collection names
      return collectionTitle(collectionNames[index]);
    }
  }

  // queryState isn't passed in (setSearchQuery)
  const title = createTitle(queryList, negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, anyAll, queryString);

  if (title === '*') return `Query ${index + 1} `;
  if (title.length > 20) return `${title.substring(0, 20)} ...`;
  return title;
};

export default tabTitle2;
