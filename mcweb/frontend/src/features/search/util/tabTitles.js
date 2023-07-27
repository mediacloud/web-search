import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';
import createTitle from './tabTitleHelpers/createTitle';
import compareArrays from './compareArrays';
import allDuplicates from './tabTitleHelpers/allDuplicates';
import collectionTitle from './tabTitleHelpers/collectionTitle';

const tabTitle = (queryList, negatedQueryList, anyAll, queryString, collectionNames, index, queryState) => {
  if (queryState) {
    // eslint-disable-next-line max-len
    const titles = queryState.map((query, i) => createTitle(query.queryList, query.negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, query.anyAll, query.queryString, queryState, i));

    // one tab
    if (queryState.length === 1) return titles[index];

    // titles and collections are duplicates
    if (allDuplicates(titles) && allDuplicates(collectionNames, compareArrays)) return `Query ${index + 1} `;

    // titles are duplicates
    if (allDuplicates(titles)) return collectionTitle(collectionNames[index]);

    return titles[index];
  }

  // queryState isn't passed in (setSearchQuery)
  const title = createTitle(queryList, negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, anyAll, queryString);
  if (title === '*') return `Query ${index + 1} `;
  if (title.length > 20) return `${title.substring(0, 20)} ...`;
  return title;
};

export default tabTitle;
