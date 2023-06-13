export const PAGE_SIZE = 100;

export const toSearchUrlParams = (params) => {
  if (params === undefined) {
    return '';
  }
  const queryParams = {};
  queryParams.limit = PAGE_SIZE;
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
