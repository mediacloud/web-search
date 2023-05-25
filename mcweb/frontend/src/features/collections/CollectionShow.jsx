import * as React from 'react';
import { useParams } from 'react-router-dom';
import SourceList from '../sources/SourceList';

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);

  return (
    <div className="container">
      <div className="row">
        <div className="col-6">
          <SourceList collectionId={collectionId} />
        </div>
      </div>
    </div>
  );
}
