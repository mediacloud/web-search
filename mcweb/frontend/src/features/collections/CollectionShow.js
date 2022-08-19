import * as React from 'react';
import { Button, Box } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useUpdateCollectionMutation } from '../../app/services/collectionsApi';

//rtk api operations...corresponding with API calls to the backend
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

  if (!collection){
    return (<></>)
  }
  else { return (
    <div className="container">
      <div className="collection-header">
        <h2 className="title">{collection.name}</h2>
        <h3> Notes: {collection.notes}</h3>
        <h5>Collection #186572515 - Public - Dynamic</h5>
      </div>
{/* 
      <div className="source-list-collection-content">

        <ul>
          <li> <Button variant='outlined' color="secondary">Source List</Button> </li>
          <li> <Button variant='outlined' color="secondary">Collection Content</Button> </li>
        </ul>
      </div> */}

      {/* 
      Recent Source Representation Metadata Coverage and Similar Collections will be implemented   
     */}

      <div className='content'>
        <div className='sources'>
          <h3>Sources</h3>
          {/* <h6>This collection includes 37 media sources </h6>
          <table>
            <tbody>
              <tr>
                <th>Media Source</th>
                <th>Stories Per Day</th>
                <th>First Story</th>
              </tr>

              <tr>
                <th >247sports.com</th>
                <td>29</td>
                <td>6/25/2018</td>
              </tr>

              <tr>
                <th>90min.com</th>
                <td>43</td>
                <td>9/23/2019</td>
              </tr>

              <tr>
                <th>bgr.com</th>
                <td>16</td>
                <td>9/23/2019</td>
              </tr>

            </tbody>
          </table> */}
        </div>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
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

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            component={Link}
            to="modify-source"
          >
            Modify this Source
          </Button>
        </Box>

      </div >
    </div >
  )};
}