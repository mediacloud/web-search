import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import { useGetGlobalCollectionsQuery } from '../../app/services/collectionsApi';

const cleanData = (data) => {
  const { collections } = data.collections;
  const countries = data.geographic_collections;
  const collectionObject = {};

  collections.forEach((collection) => {
    collectionObject[collection.id] = collection;
  });

  return countries.map((country) => {
    const fullCollections = [];

    country.collections.forEach((collection) => {
      fullCollections.push(collectionObject[collection]);
    });
    return { name: country.name, collections: fullCollections };
  });
};

export default function GeographicNewsCollections() {
  const { data, isLoading } = useGetGlobalCollectionsQuery();
  if (!data) return null;
  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }
  const geographicCollections = cleanData(data);
  return (

    <div className="container">
      <div className="row header-container">

        <h1 className="geo-header col-12">Collections by Country</h1>
      </div>
      {geographicCollections.map((country) => (
        <div className="row table-container" key={country.name}>
          <h4>{country.name}</h4>
          <table className="col-12">
            <thead>
              <tr className="row">
                <th className="col-4">Name</th>
                <th className="col-8">Description</th>
              </tr>
            </thead>
            {country.collections.map((collection) => (
              <tr key={collection.id} className="row">
                <td className="col-4">
                  <Link to={`/collections/${collection.id}`} target="_blank" rel="noopener noreferrer">
                    {collection.name}
                  </Link>
                </td>
                <td className="col-8">
                  {collection.notes}
                </td>
              </tr>

            ))}
          </table>
        </div>
      ))}
    </div>
  );
}
