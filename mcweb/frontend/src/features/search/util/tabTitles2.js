import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';
import queryGenerator from './queryGenerator';
import compareArrays from './compareArrays';
import allDuplicates from './tabTitleHelpers/allDuplicates';
import collectionTitle from './tabTitleHelpers/collectionTitle';
import simplifyQueryList from './tabTitleHelpers/simplifyQueryList';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString, index, queryState) => {
  // advanced mode
  if (queryString) return queryString;
  // not advanced mode

  // remove duplicated elements in queryList if anyAll are the same
  if (queryState) {
    const queryLists = queryState.map((q) => q.queryList);
    console.log(queryLists);
    const anyAlls = queryState.map((q) => q.anyAll);
    console.log(anyAlls);

    const simplifiedQueryLists = simplifyQueryList(index, queryLists, anyAlls);
    // console.log('');
    // console.log(`index: ${index}`);
    // console.log(`simplifiedQueryLists: ${simplifiedQueryLists}`);
    // console.log(`queryGenerator: ${queryGenerator(simplifiedQueryLists, negatedQueryList, platform, anyAll)}`);
    return queryGenerator(simplifiedQueryLists, negatedQueryList, platform, anyAll);
  }
  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

const tabTitle2 = (queryList, negatedQueryList, anyAll, queryString, collectionNames, index, queryState) => {
  if (queryState) {
    // console.log(queryState.map((q) => q.queryList));

    // eslint-disable-next-line max-len
    const titles = queryState.map((query, i) => createTitle(query.queryList, query.negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, query.anyAll, query.queryString, i, queryState));

    // one tab
    if (queryState.length === 1) return titles[index];

    // titles and collections are duplicates
    if (allDuplicates(titles) && allDuplicates(collectionNames, compareArrays)) return `Query ${index + 1} `;

    // titles are duplicates
    if (allDuplicates(titles)) return collectionTitle(collectionNames[index]);

    console.log(titles);
    return titles[index];
  }

  // queryState isn't passed in (setSearchQuery)
  const title = createTitle(queryList, negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, anyAll, queryString);
  if (title === '*') return `Query ${index + 1} `;
  if (title.length > 20) return `${title.substring(0, 20)} ...`;
  return title;
};

export default tabTitle2;
