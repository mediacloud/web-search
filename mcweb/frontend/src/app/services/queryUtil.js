
export const PAGE_SIZE = 100;

export const toSearchUrlParams = (params) => {
  let queryParams = {};
  queryParams.limit = PAGE_SIZE;
  if (params.page) {
    queryParams.offset = params.page ? PAGE_SIZE*params.page : 0;
  }
  for (const [key, value] of Object.entries(params)) {
    if (key == 'page') {
      continue;
    }
    queryParams[key] = value;
  }
  return new URLSearchParams(queryParams).toString();
}
