import allDuplicates from './allDuplicates';
import existsInAll from './existsInAll';
import removePhrase from './removePhrase';
import compareArrays from '../compareArrays';

const simplifyQueryList = (index, queryLists, anyAlls) => {
  const originalQuery = queryLists[index];
  let updatedQueryLists = queryLists;

  // remove all '[]' from arrays
  updatedQueryLists.forEach((query, i) => {
    updatedQueryLists[i] = query.filter((phrase) => !compareArrays(phrase, []));
  });

  // are the anyAlls all duplicates?
  if (allDuplicates(anyAlls)) {
    // unique phrases
    const uniquePhrases = [...new Set(updatedQueryLists.flat())];

    // go through each phrase. if they exist in every query, remove it
    for (let phraseIndex = 0; phraseIndex < uniquePhrases.length; phraseIndex += 1) {
      if (existsInAll(uniquePhrases[phraseIndex], updatedQueryLists)) {
        updatedQueryLists = removePhrase(uniquePhrases[phraseIndex], updatedQueryLists);
      }
    }

    // if all values are removed, return the original query
    if (compareArrays(updatedQueryLists[index], [])) {
      return originalQuery;
    }

    // return simplified query
    return updatedQueryLists[index];
  }
  // anyAlls do not match, return original query
  return queryLists[index];
};

export default simplifyQueryList;
