import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';
import queryGenerator from './queryGenerator';
import compareArrays from './compareArrays';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  if (queryString) {
    return queryString;
  }
  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

const createCollectionTitle = (names) => {
  let collectionTitle = '';
  for (let i = 0; i < names.length; i += 1) {
    if (names[i].length > 20) {
      collectionTitle += `'${names[i].substring(0, 20)}' ... & `;
    } else {
      collectionTitle += `'${names[i]}'  & `;
    }
  }
  return collectionTitle.slice(0, -2);
};

const tabTitle2 = (queryList, negatedQueryList, anyAll, queryString, index, queryState, collectionNames) => {
  if (queryState) {
    const titles = queryState.map(
      (query) => createTitle(query.queryList, query.negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, query.anyAll, query.queryString),
    );
    if (queryState.length > 1) {
      const titlesDuplicates = titles.every((title) => title === titles[0]);
      if (titlesDuplicates) {
        const collectionsDuplicates = collectionNames.every((collection) => compareArrays(collection, collectionNames[0]));
        if (!collectionsDuplicates) {
          return collectionNames[index];
        }
        return `Query ${index + 1} `;
      }

      /*
clever idea:

the system heuristic be able to determine which part of the queries
are different and use that for naming. Ie. if they search for
'robot AND monkey' and 'robot AND dog', it should name the queries
'monkey' and 'dog' based on the fact that they both start with "robot AND"
*/

      // IMPLEMENT here
    }
  }

  // queryState isn't passed in (setSearchQuery)
  const title = createTitle(queryList, negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, anyAll, queryString);

  if (title === '*') {
    return `Query ${index + 1} `;
  }
  if (title.length > 20) {
    return `${title.substring(0, 20)} ...`;
  }
  return title;
};

export default tabTitle2;
