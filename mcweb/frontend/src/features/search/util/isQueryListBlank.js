export default function isQueryListBlank(queryList) {
  if (Array.isArray(queryList)) {
    return queryList.every((element) => isQueryListBlank(element));
  }
  return queryList === '' || queryList === null || queryList === undefined;
}
