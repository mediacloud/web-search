import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import { useGetGlobalCollectionsQuery } from '../../app/services/collectionsApi';

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
  return (

    <div className="container">
      <div className="row header-container">

        <h1 className="geo-header col-12">Collections by Country</h1>
      </div>
      {data.countries.map((countryAndCollections) => (
        <div className="row table-container" key={countryAndCollections.country.name}>
          <h4>{countryAndCollections.country.name}</h4>
          <table className="col-12">
            <thead>
              <tr className="row">
                <th className="col-4">Name</th>
                <th className="col-8">Description</th>
              </tr>
            </thead>
            {countryAndCollections.collections.map((collection) => (
              <tr key={collection.tags_id} className="row">
                <td className="col-4">
                  <Link to={`/collections/${collection.tags_id}`} target="_blank" rel="noopener noreferrer">
                    {collection.label}
                  </Link>
                </td>
                <td className="col-8">
                  {collection.description}
                </td>
              </tr>

            ))}
          </table>
        </div>
      ))}
    </div>
  );
}
