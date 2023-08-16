const compareArrays = (arr1, arr2) => {
  if (arr1 === arr2) {
    return true;
  }

  if (arr1 == null || arr2 == null || arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i += 1) {
    if (Array.isArray(arr1[i]) && Array.isArray(arr2[i])) {
      if (!compareArrays(arr1[i], arr2[i])) {
        return false;
      }
    } else if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
};

export default compareArrays;
