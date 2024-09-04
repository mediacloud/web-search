export const PAGE_SIZE = 100;
// added noLimit argument, bool if limit should be added to params (true = no limit, false/undefined = limit)
export const toSearchUrlParams = (params, noLimit) => {
  if (params === undefined) {
    return '';
  }
  const queryParams = {};
  if (!noLimit) {
    queryParams.limit = PAGE_SIZE;
  }
  if (params.page) {
    queryParams.offset = params.page ? PAGE_SIZE * params.page : 0;
  }
  // for (const [key, value] of Object.entries(params)) {
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'page') {
      return;
    }
    queryParams[key] = value;
  });

  return new URLSearchParams(queryParams).toString();
};
