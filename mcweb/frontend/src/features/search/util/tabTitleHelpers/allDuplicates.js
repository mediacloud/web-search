export default function allDuplicates(array, compare) {
  // compare strings, ints, booleans
  if (compare === undefined) {
    return array.every((a) => a === array[0]);
  }
  // compare arrays, objects (pass in compareArrays for instance)
  return array.every((a) => compare(a, array[0]));
}
