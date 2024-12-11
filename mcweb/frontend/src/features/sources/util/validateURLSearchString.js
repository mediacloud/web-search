const hasTrailingWildCard = (urlSearchString) => {
  const lastChars = String(urlSearchString).slice(-2);
  return lastChars === '/*';
};
const noHttp = (urlSearchString) => {
  const firstChars = String(urlSearchString).slice(0, 4);
  return firstChars.includes('http');
};

const validateURLSearchString = (urlSearchString) => {
  if (!urlSearchString) return false;
  if (urlSearchString) {
    if (!hasTrailingWildCard(urlSearchString)) {
      return 'URL search string does not end in /*';
    }
  }
  if (noHttp(urlSearchString)) {
    return 'URL search string starts with http';
  }
  return false;
};

export default validateURLSearchString;
