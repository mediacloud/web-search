import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetGlobalCollectionsQuery } from '../../app/services/collectionsApi';

export default function GlobalCollections() {
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
    </div>
  );
}
