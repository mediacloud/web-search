const removePhrase = (phrase, queryLists) => {
  const updatedQueryLists = queryLists;
  updatedQueryLists.forEach((sublist, index) => {
    updatedQueryLists[index] = sublist.filter((element) => element !== phrase);
  });
  return updatedQueryLists;
};

export default removePhrase;
