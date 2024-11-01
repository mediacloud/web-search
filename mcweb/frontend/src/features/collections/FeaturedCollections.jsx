import * as React from 'react';
import { Link } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { platformDisplayName } from '../ui/uiUtil';

import { useGetFeaturedCollectionsQuery } from '../../app/services/collectionsApi';
import formatNotesToHTML from './util/formatNotesToHTML';

export default function FeaturedCollections() {
  const { data, isLoading } = useGetFeaturedCollectionsQuery({ platform: 'onlinenews' });
  const featuredCollections = data;
  return (
    <div className="featured-collections-wrapper">
      <div className="row">
        <div className="col-12">
          <h2>Featured Collections</h2>
        </div>
      </div>
      <div className="featured-collection-list">
        <div className="row">
          { isLoading && (<CircularProgress size="75px" />)}
          { !isLoading
            && (featuredCollections.collections.map((collection) => (
              <div className="col-4" key={collection.id}>
                <div key={`featured-collection-${collection.id}`} className="featured-collection">
                  <em>
                    {platformDisplayName(collection.platform)}
                  </em>
                  <Link to={`/collections/${collection.id}`}>
                    <h3>{collection.name}</h3>
                  </Link>
                  <div
                      dangerouslySetInnerHTML={{
                          __html: formatNotesToHTML(collection.notes),
                      }}
                  />
                </div>
              </div>
            )))}
        </div>
      </div>
    </div>
  );
}
