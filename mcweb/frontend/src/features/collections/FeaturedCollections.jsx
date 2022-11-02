import * as React from 'react';
import { styled } from '@mui/material/styles';
import { Paper, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import { useGetFeaturedCollectionsQuery } from '../../app/services/collectionsApi';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.primary,
}));

export default function FeaturedCollections() {
  const { data, isLoading } = useGetFeaturedCollectionsQuery();
  const featuredCollections = data;
  if (isLoading) {
    return (<div>Loading...</div>);
  }
  return (
    <>
      <div className="collectionTitle">
        <h1>Featured Collections</h1>
      </div>

      <div className="featuredCollection">
        {
            (featuredCollections.collections.map((collection) => (
              <Grid key={`featured-collection-${collection.id}`}>
                <Link to={`/collections/${collection.id}`}>
                  <Item>{collection.name}</Item>
                </Link>
              </Grid>
            )))
          }
      </div>
    </>
  );
}
