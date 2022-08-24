import * as React from 'react';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';

import { useGetHomeCollectionsQuery } from '../../app/services/collectionsApi';


const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.primary
}));


export default function CollectionHome() {
    const {data} = useGetHomeCollectionsQuery();
    if (data) console.log(data);
    
    return (
        <div>
            {console.log("hello")}
            <h1>Featured Collections</h1>
            {/* {(collections.featuredCollections.entries.map((collection) => 
                collection.tags.map((tag) =>
                    <Grid key={tag} item xs={12} sm={6} md={4} lg={3}>
                        <Link to={`/collections/${tag}`}>
                            <Item>{collection._comment}</Item>
                        </Link>
                    </Grid>     
            )))} */}
        </div >
    );
}
