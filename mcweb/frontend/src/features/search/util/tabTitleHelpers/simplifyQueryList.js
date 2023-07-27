import allDuplicates from './allDuplicates';
import existsInAll from './existsInAll';
import removePhrase from './removePhrase';
import compareArrays from '../compareArrays';

// remove all duplicate elements in lists (used in createTitle, for queryLists and negatedQueryLists)
const simplifyQueryList = (index, queryLists, anyAlls) => {
  const originalQuery = queryLists[index];
  let updatedQueryLists = queryLists;

  // if anyAll === undefined then negatedQuery (all AND NOT), else, check if anyAlls array all match
  const queryListsCanSimplify = anyAlls === undefined ? true : allDuplicates(anyAlls);

  // remove all '[]' from arrays
  updatedQueryLists.forEach((query, i) => {
    updatedQueryLists[i] = query.filter((phrase) => !compareArrays(phrase, []));
  });

  if (queryListsCanSimplify) {
    // unique phrases
    const uniquePhrasesInQueryList = [...new Set(updatedQueryLists.flat())];

    // go through each phrase. if they exist in every query, remove it
    for (let phraseIndex = 0; phraseIndex < uniquePhrasesInQueryList.length; phraseIndex += 1) {
      if (existsInAll(uniquePhrasesInQueryList[phraseIndex], updatedQueryLists)) {
        updatedQueryLists = removePhrase(uniquePhrasesInQueryList[phraseIndex], updatedQueryLists);
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
