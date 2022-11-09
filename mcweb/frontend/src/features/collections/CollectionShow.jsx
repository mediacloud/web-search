import * as React from 'react';
import { Button } from '@mui/material';
import { Link, useParams } from 'react-router-dom';

import CollectionHeader from './CollectionHeader';
import SourceList from '../sources/SourceList';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);

  return (
    <>

      <CollectionHeader collectionId={collectionId} />

      <div className="sub-feature">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <Button variant="outlined" target="_blank" href={`/api/sources/sources/download_csv/?collection_id=${collectionId}`}>
                Download Source CSV
              </Button>
              &nbsp;&nbsp;&nbsp;
              <Permissioned role={ROLE_STAFF}>
                <Button variant="outlined" component={Link} to="modify-collection">
                  Modify Collection
                </Button>
              </Permissioned>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-6">
            <SourceList collectionId={collectionId} />
          </div>
        </div>
      </div>
    </>
  );
}
