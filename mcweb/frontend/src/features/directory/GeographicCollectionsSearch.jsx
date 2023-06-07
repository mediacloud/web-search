import * as React from 'react';
import { useGetGlobalCollectionsQuery } from '../../app/services/collectionsApi';
import MediaSearchTable from './MediaSearchTable';

export default function GeographicCollectionsSearch() {
  const { data, isLoading } = useGetGlobalCollectionsQuery();

  if (isLoading) {
    return (<div>Loading...</div>);
  }
  const formattedData = data.countries.map((countryAndCollections) => countryAndCollections.collections.map((collection) => ({
    id: collection.tags_id,
    name: collection.label,
    notes: collection.description,
    source_count: collection.length,
  }))).flat();

  return (
    <div className="container">
      <MediaSearchTable
        matching={formattedData}
        collection
      />
    </div>
  );
}
