import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import collections from './media-collection.json'

import { setCollection } from './collectionsSlice';


const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.primary
}));





export default function CollectionHome() {

    return (
        <div>
            <h1>Featured Collections</h1>

            {(collections.featuredCollections.entries.map((collection) => 
                collection.tags.map((tag) =>
                    <Grid key={tag} item xs={12} sm={6} md={4} lg={3}>
                        <Link to={`/collections/${tag}`}>
                            <Item>{collection._comment}</Item>
                        </Link>
                    </Grid>     
            )))}
        </div >
    );
}
