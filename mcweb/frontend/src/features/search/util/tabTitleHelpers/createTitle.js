import queryGenerator from '../queryGenerator';
import simplifyQueryList from './simplifyQueryList';

const createTitle = (queryList, negatedQueryList, platform, anyAll, queryString, queryState, index) => {
  // advanced mode
  if (queryString) return queryString;

  if (queryState) {
    const queryLists = queryState.map((q) => q.queryList);
    const negatedQueryLists = queryState.map((q) => q.negatedQueryList);
    const anyAlls = queryState.map((q) => q.anyAll);
    const simplifiedQueryLists = simplifyQueryList(index, queryLists, anyAlls);
    const simplifiedNegatedQueryList = simplifyQueryList(index, negatedQueryLists);
    return queryGenerator(simplifiedQueryLists, simplifiedNegatedQueryList, platform, anyAll);
  }

  return queryGenerator(queryList, negatedQueryList, platform, anyAll);
};

export default createTitle;