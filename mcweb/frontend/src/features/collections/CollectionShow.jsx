import * as React from 'react';
import { useParams } from 'react-router-dom';
import SourceList from '../sources/SourceList';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);
  const {
    data: collection,
  } = useGetCollectionQuery(collectionId);
  
  return (
    <div className="container">
      <div className="row">
        <div className="col-6">
          <SourceList collectionId={collectionId} isOnlineNews={collection.platform == "online_news"}/>
        </div>
      </div>
    </div>
  );
}
