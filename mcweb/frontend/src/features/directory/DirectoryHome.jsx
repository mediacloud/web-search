import React, { useEffect } from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import FeaturedCollections from '../collections/FeaturedCollections';
import { PermissionedContributor } from '../auth/Permissioned';
import DirectorySearch from './DirectorySearch';
import DetailedSearch from './DetailedSearch';
import Header from '../ui/Header';
import ControlBar from '../ui/ControlBar';

export default function DirectoryHome() {
  useEffect(() => {
    document.title = 'Media Cloud Directory';
  });

  return (
    <>
      <Header columns={6}>
        <h1>Directory</h1>
        <p>
          <Link to="/collections/news/geographic">
            Check the breadth of our global coverage
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          </Link> by browsing the media sources
          and collections in our directory, and suggesting more to add.
        </p>
      </Header>
      <ControlBar customColumns>
        <div className="col-7">
          <Button variant="outlined">
            <Link to="/collections/news/geographic">Browse Geographic News Collections</Link>
          </Button>
          <DetailedSearch />
          <PermissionedContributor>
            <>
              <Button variant="outlined" startIcon={<LockOpenIcon />}>
                <Link to="/collections/create">Create Collection</Link>
              </Button>
              <Button variant="outlined" startIcon={<LockOpenIcon />}>
                <Link to="/sources/create">Create Source</Link>
              </Button>
            </>
          </PermissionedContributor>
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
