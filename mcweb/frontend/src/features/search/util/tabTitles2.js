import { useSelector } from 'react-redux';
import { PROVIDER_NEWS_MEDIA_CLOUD } from './platforms';
import queryGenerator from './queryGenerator';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString) => {
  if (queryString) {
    return queryString;
  }
  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

const tabTitle2 = (queryList, negatedQueryList, anyAll, queryString, index, queryState, collectionNames) => {
  // queryState is passed in from TabbedSearch to check agianst:
  // if titles generated are the same (ex. 'Hello and World' and 'Hello and World') =>
  // use different collection as title

  // console.log(collectionNames);

  // if (queryState) {
  //   const titles = [];

  //   queryState.forEach((query) => {
  //     titles.push(
  //       createTitle(query.queryList, query.negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, query.anyAll, query.queryString),
  //     );
  //   });

  //   const titlesDuplicates = titles.every((title) => title === titles[0]);
  //   if (titlesDuplicates) {
  //     // console.log(queryState);
  //     // console.log(queryState[index].collections);
  //     return queryState[index].collections.name;
  //   }
  // }

  const title = createTitle(queryList, negatedQueryList, PROVIDER_NEWS_MEDIA_CLOUD, anyAll, queryString);

  if (title === '*') {
    return `Query ${index + 1}`;
  } if (title.length > 20) {
    return `${title.substring(0, 20)} ...`;
  }
  return title;
};

export default tabTitle2;
