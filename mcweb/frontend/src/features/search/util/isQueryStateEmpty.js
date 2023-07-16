import isQueryListBlank from './isQueryListBlank';

export default function isQueryStateEmpty(queryState) {
  return queryState.every(({
    queryList, negatedQueryList, advanced, queryString,
  }) => isQueryListBlank(queryList) && isQueryListBlank(negatedQueryList) && (!advanced || queryString.trim() === ''));
}
