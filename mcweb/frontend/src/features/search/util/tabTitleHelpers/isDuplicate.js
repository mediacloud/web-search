export default function allDuplicates(compare, array) {
  // compare strings, ints, booleans
  if (compare === null) {
    return array.every((a) => a === array[0]);
  }
  // compare arrays, objects (pass in compareArrays for instance)
  return array.every((a) => compare(a, array[0]));
}
