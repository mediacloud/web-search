import * as React from 'react';
import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Paper, Grid, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import CollectionItem from '../collections/CollectionItem';
import { useState } from 'react';
//rtk api operations...corresponding with API calls to the backend
import { useGetSourceAndAssociationsQuery } from '../../app/services/sourcesCollectionsApi';

//rtk actions to change state
import { setSourceCollectionsAssociations } from '../sources_collections/sourcesCollectionsSlice';
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
  const [isShown, setIsShown] = useState(false)

  const params = useParams()
  const sourceId = Number(params.sourceId);

  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetSourceAndAssociationsQuery(sourceId);

  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      dispatch(setSourceCollectionsAssociations(data))
      dispatch(setSource(data))
      dispatch(setCollections(data))
    }
  }, [data]);

  const source = useSelector(state => state.sources[sourceId]);
  const collections = useSelector(state => {
    return state.sourcesCollections.map(assoc => {
      return state.collections[assoc.collection_id]
    })
  })

  if (!source || collections[0] === collections[1]) {
    return (<></>)
  }
  else {
    return (
      <div>
        <h1>{source.label}</h1>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            component={Link}
            to="modify-source"
            state={collections}
          >
            Modify this Source
          </Button>

          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
            onClick={async () => {
              setIsShown(!isShown)
            }}
          >
            {source.label}'s Collections
          </Button>
          {/* <Link to={"modify-source"} collections={collections}><h3>Modify This Source</h3></Link> */}
        </Box>
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
        </Box>

        {isShown && (
          <div>
            <h3>Collections</h3>
            <h4>This Source has {Object.values(collections).length} Collections</h4>
            <ul>
              {Object.values(collections).map(collection => {
                return <CollectionItem key={`collection${collection.id}`} collection={collection} />
              })}
            </ul>
          </div>
        )}


      </div>
    )
  };
}