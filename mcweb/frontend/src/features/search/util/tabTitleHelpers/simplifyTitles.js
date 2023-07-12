const simplifyTitles = (strings) => {
  if (!strings.length) {
    return [];
  }

  let prefix = strings[0]; // Assume the first string as the prefix initially

  // Find the common prefix among all strings
  for (let i = 1; i < strings.length; i += 1) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }

  // Remove the common prefix from each string
  const modifiedStrings = strings.map((string) => string.slice(prefix.length));

  return modifiedStrings;
};

export default simplifyTitles;
