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
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-8">
              <h1>Geographic Online News Collections</h1>
              <p>We have curated a set of collections by geography. For each country below we have a national collection, which includes media sources that report about the whole country. For many countries we also have state- or province-level collections, for media sources that are published in and focus on that part of the country.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
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
              <tbody>
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
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
