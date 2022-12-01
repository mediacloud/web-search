import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
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
    <div>
      {console.log(data)}
      {/* {data.geographic_collections.map((country) => (
        <div>
          <h3>{country.name}</h3>
          {country.collections.map((collection) => (
            <div>
              <h4>{collection}</h4>
            </div>
          ))}
        </div>
      ))} */}
    </div>
  );
}
