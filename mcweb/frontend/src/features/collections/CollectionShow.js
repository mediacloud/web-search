import * as React from 'react';
import { Button, Box } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useState } from 'react';

import SourceItem from '../sources/SourceItem';

//rtk api operations
import {
  useGetCollectionAndAssociationsQuery,
} from '../../app/services/sourcesCollectionsApi';

//rtk actions to change state
import {
  setCollectionSourcesAssociations,
} from '../sources_collections/sourcesCollectionsSlice';
import { setCollection } from './collectionsSlice';
import { setSources } from '../sources/sourceSlice';



export default function CollectionShow() {
  const params = useParams()
  const collectionId = Number(params.collectionId);
  const [isShown, setIsShown] = useState(true)


  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetCollectionAndAssociationsQuery(collectionId);

  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      dispatch(setCollectionSourcesAssociations(data))
      dispatch(setSources(data))
      dispatch(setCollection(data))
    }
  }, [data]);

  const collection = useSelector(state => state.collections[collectionId]);

  const sources = useSelector(state => {
    return state.sourcesCollections.map(assoc => {
      return state.sources[assoc.source_id]
    })
  })

  if (!collection || sources[0] === sources[1]) {
    return (<></>)
  }
  else {
    return (
      <>
        <div className="collectionTitle">

          <div className="collectionInformation">
            <h2 className="title">{collection.name}</h2>
            <h3> Notes: {collection.notes}</h3>
          </div>

          <div className="buttons">
            <Button
              style={{ backgroundColor: "white" }}
              variant='contained'
              sx={{ my: 2.25, color: 'black', display: 'block' }}
              component={Link}
              to="modify-collection"
            >
              Modify this Collection
            </Button>

            <Button
              style={{ backgroundColor: "white" }}
              variant='contained'
              sx={{ my: 2.25, color: 'black', display: 'block' }}
              onClick={async () => {
                setIsShown(!isShown)
              }}
            >
              Sources
            </Button>
          </div>
        </div>

        {isShown &&
          <div className="collectionSources">
            <h3 className='collectionSourcesInformation'>{collection.name} contains {Object.values(sources).length} media sources </h3>
            <ul>
              {Object.values(sources).map(source => {
                return <SourceItem key={`source-item-${source.id}`} source={source} />
              })
              }
            </ul>
          </div>
        }
      </>
    )
  }
}