const collectionTitle = (collections) => {
  if (collections.length === 0) return 'No Collections';
  const titles = collections.map((collection) => `'${collection}'`);
  return titles.join(' & ');
};
export default collectionTitle;
