import allDuplicates from './allDuplicates';

const simplifyTitles = (titles, anyAlls) => {
  if (!titles.length) return [];

  if (!allDuplicates(anyAlls)) return titles;

  let prefix = titles[0]; // Assume the first string as the prefix initially

  // Find the common prefix among all strings
  for (let i = 1; i < titles.length; i += 1) {
    while (!titles[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }

  const simplifiedTitles = titles.map((title) => {
    let modifiedTitle = title.slice(prefix.length);

    if (modifiedTitle.startsWith(' AND ')) {
      modifiedTitle = modifiedTitle.slice(5); // Remove "AND " from the beginning
    } else if (modifiedTitle.startsWith(' OR ')) {
      modifiedTitle = modifiedTitle.slice(4); // Remove "OR " from the beginning
    }

    if (modifiedTitle.endsWith(')') && prefix.length > 1) {
      modifiedTitle = modifiedTitle.slice(0, -1); // Remove the last character (')')
    }

    if (modifiedTitle === '') {
      modifiedTitle = title;
    }

    return modifiedTitle;
  });

  return simplifiedTitles;
};

export default simplifyTitles;
