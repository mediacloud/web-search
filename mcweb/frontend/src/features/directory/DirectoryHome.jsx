import * as React from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import FeaturedCollections from '../collections/FeaturedCollections';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import DirectorySearch from './DirectorySearch';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';

export default function DirectoryHome() {
  return (
    <>
      <Header columns={6}>
        <h1>Directory</h1>
        <p>
          <Link to="/collections/news/geographic">Check the breadth of our global coverage</Link>
          {' '}
          by browsing the media sources
          and collections in our directory, and suggesting more to add.
        </p>
      </Header>
      <ControlBar customColumns>
        <div className="col-7">
          <Button variant="outlined">
            <Link to="/collections/news/geographic">Browse Geographic News Collections</Link>
          </Button>
          <Permissioned role={ROLE_STAFF}>
            <>
              <Button variant="outlined" endIcon={<LockOpenIcon />}>
                <Link to="/collections/create">Create Collection</Link>
              </Button>
              <Button variant="outlined" endIcon={<LockOpenIcon />}>
                <Link to="/sources/create">Create Source</Link>
              </Button>
            </>
          </Permissioned>
        </div>
        <div className="col-5 float-right">
          <DirectorySearch />
        </div>
      </ControlBar>
      <div className="container">
        <FeaturedCollections />
      </div>
    </>
  );
}
