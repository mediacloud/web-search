import * as React from 'react';
import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import {useSelector, useDispatch} from 'react-redux'
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import CollectionItem from '../collections/CollectionItem';

//rtk api operations...corresponding with API calls to the backend
import { 
  useCreateSourceCollectionAssociationMutation, 
  useGetSourceAndAssociationsQuery,
  useDeleteSourceCollectionAssociationMutation
} from '../../app/services/sourcesCollectionsApi';

//rtk actions to change state
import {
  setSourceCollectionsAssociations, 
  setSourceCollectionAssociation,
  dropSourceCollectionAssociation
 } from '../sources_collections/sourcesCollectionsSlice';
import { setSource } from './sourceSlice';
import { setCollections } from '../collections/collectionsSlice';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.primary
}));

export default function SourceShow() {
  const params = useParams()
  const sourceId = Number(params.sourceId);
  
  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetSourceAndAssociationsQuery(sourceId);
 
  const newAssoc = {
    'source_id': 1,
    'collection_id': 9357186
  }

  const deleteAssoc = {
    'source_id': 1,
    'collection_id': 9357186
  }

  const [makeSourceCollectionAssociation, createResult] = useCreateSourceCollectionAssociationMutation();
  
  const [deleteSourceCollectionAssociation, deleteResult] = useDeleteSourceCollectionAssociationMutation();
 
 
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (data){
      dispatch(setSourceCollectionsAssociations(data))
      dispatch(setSource(data))
      dispatch(setCollections(data))
    }
  }, [data]);

  // const { 
  //   name,
  //   url_search_string,
  //   label,
  //   homepage,
  //   notes,
  //   service,
  //   stories_per_week,
  //   pub_country,
  //   pub_state,
  //   primary_language,
  //   media_type 
  // } = 
  const source = useSelector(state => state.sources[sourceId]);
  const collections = useSelector(state => state.collections)
  
  if (!source){
    return (<></>)
  }
  else {return (
    <div style={{ paddingTop: "100px" }}>
      <h1>{source.label}</h1>
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Name: {source.name}  </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Covered Since: {source.first_story} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Homepage: {source.homepage} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Stories per week: {source.stories_per_week} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Item>Notes: {source.notes} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Item>With Themes: </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Item>Publication Country: {source.pub_country} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Publication State: {source.pub_state} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Detected Primary Language: {source.primary_language} </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Detected Subject State:  </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3} >
            <Item>Media Type: {source.media_type} </Item>
          </Grid>
        </Grid>
        <button onClick={()=>(
          makeSourceCollectionAssociation(newAssoc)
            .then(results => dispatch(setSourceCollectionAssociation(results.data)))
      )}>Click Me to make new association</button>

      <button onClick={() =>(
          dispatch(setSourceCollectionsAssociations(data)),
            dispatch(setSource(data)),
            dispatch(setCollections(data))
      )}>
        Get associations
      </button>

        <button onClick={() => (
          deleteSourceCollectionAssociation(deleteAssoc)
            .then(results => dispatch(dropSourceCollectionAssociation(results)))
        )}>
          Delete associations
        </button>

      </Box>
      <h3>Collections</h3>
      {console.log(Object.values(collections))}
      <ul>
        {Object.values(collections).map(collection => {
          return <Link to={`/collections/${collection.id}`} > <CollectionItem key={collection.id} collection={collection} /> </Link>
        })}
      </ul>
     
    </div>
  )};
}