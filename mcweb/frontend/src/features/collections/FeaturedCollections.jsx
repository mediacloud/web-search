import * as React from 'react';
import { Link } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { platformDisplayName } from '../ui/uiUtil';

import { useGetFeaturedCollectionsQuery } from '../../app/services/collectionsApi';

export default function FeaturedCollections() {
  const { data: featuredCollections, isLoading, error } = useGetFeaturedCollectionsQuery({ platform: 'onlinenews' });
  console.log(featuredCollections);
  console.log(error);
  return (
    <div className="featured-collections-wrapper">
      <div className="row">
        <div className="col-12">
          <h2>Featured Collections</h2>
        </div>
      </div>
      <div className="featured-collection-list">
        <div className="row">
          {isLoading && (<CircularProgress size="75px" />)}
          {!isLoading
            && (featuredCollections.collections.map((collection) => (
              <div className="col-4" key={collection.id}>
                <div key={`featured-collection-${collection.id}`} className="featured-collection">
                  <em>
                    {platformDisplayName(collection.platform)}
                  </em>
                  <Link to={`/collections/${collection.id}`}>
                    <h3>{collection.name}</h3>
                  </Link>
                  <p>{collection.notes}</p>
                </div>
              </div>
            )))}
        </div>
      </div>
    </div>
  );
}
