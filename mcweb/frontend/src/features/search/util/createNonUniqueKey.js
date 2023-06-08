// after doing some research on common practicies of using unique keys:
// I'll go down a path of creating a key based off a combinaton of multiple attributes

const createNonUniqueKey = (dataObject, index) => JSON.stringify(dataObject) + index;

export default createNonUniqueKey;
