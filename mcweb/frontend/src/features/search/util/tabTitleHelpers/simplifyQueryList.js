import allDuplicates from './allDuplicates';
import existsInAll from './existsInAll';
import removePhrase from './removePhrase';

const simplifyQueryList = (index, queryLists, anyAlls) => {
  const updatedQueryLists = queryLists;
  if (allDuplicates(anyAlls)) {
    let uniquePhrases = [...new Set(updatedQueryLists.flat())];

    for (let phraseIndex = 0; phraseIndex < uniquePhrases.length; phraseIndex += 1) {
      if (existsInAll(uniquePhrases[phraseIndex], queryLists)) {
        uniquePhrases = removePhrase(uniquePhrases[phraseIndex], queryLists);
      }
    }
    return uniquePhrases[index];
  }
  return queryLists;
};

export default simplifyQueryList;
