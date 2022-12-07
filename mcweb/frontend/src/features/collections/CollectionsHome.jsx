import * as React from 'react';
import { Button } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import FeaturedCollections from './FeaturedCollections';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';

export default function CollectionsHome() {
  const location = useLocation();

  if (location.pathname !== '/collections') return null;
  return (
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-4">
              <h1>Collections</h1>
              <p>
                <Link to="/collections/news/geographic">Check the breadth of our global coverage</Link>
                {' '}
                by browsing the media sources
                and collections in our database, and suggesting more to add.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="sub-feature">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <Button variant="outlined">
                <Link to="news/geographic">Browse Geographic News Collections</Link>
              </Button>
              <Permissioned role={ROLE_STAFF}>
                  <Button variant="outlined">
                    <Link to="create">Create a New Collection</Link>
                  </Button>
                </Permissioned>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <FeaturedCollections />
      </div>
    </>
  );
}
