import * as React from 'react';
import { Button, Box } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';

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

  if (!collection || sources[0] === sources[1]){
    return (<></>)
  }
  else { return (
    <div className="collection-show-container">
      <div className="collection-header">
        <h2 className="title">{collection.name}</h2>
        <h3> Notes: {collection.notes}</h3>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', backgroundColor:'white' } }}>
          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            component={Link}
            to="modify-collection"
          >
            Modify this Collection
          </Button>
        </Box>
      </div>
      <div className='content'>
        <div className='sources'>
          <h3>Sources</h3>
          <h6>This collection includes {Object.values(sources).length} media sources </h6>
          {/* <table>
            <tbody>
              <tr>
                <th>Media Source</th>
                <th>Stories Per Day</th>
                <th>First Story</th>
              </tr>
            </tbody>
          </table> */}
          <ul>
          { 
            Object.values(sources).map(source => {
              return  <SourceItem key={`source-item-${source.id}`} source={source} />
            })
          }
          </ul>
        </div>
      </div >
    </div >
  )};
}