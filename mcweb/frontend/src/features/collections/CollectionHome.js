import * as React from 'react';
import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { useSelector, useDispatch } from 'react-redux'
import { Link, Outlet } from 'react-router-dom';
//rtk api operations...corresponding with API calls to the backend
import {
    useCreateSourceCollectionAssociationMutation,
    useGetSourceAndAssociationsQuery,
    useGetCollectionAndAssociationsQuery,
    useCreateSourceCollectionAssociation,
    useDeleteSourceCollectionAssociationMutation
} from '../../app/services/sourcesCollectionsApi';
//rtk actions to change state
import {
    setCollectionSourcesAssociations,
    setSourceCollectionsAssociations,
    setSourceCollectionAssociation,
    dropSourceCollectionAssociation
} from '../sources_collections/sourcesCollectionsSlice';



const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.primary
}));

export default function CollectionHome() {
    const store = useSelector((store) => store);
    const dispatch = useDispatch();

    useEffect(() => {
        console.log("CollectionHome")
    }, []);
    return (
        <div style={{ paddingTop: "100px" }}>

            <h1>Collections Home</h1>
            <Box sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/1"}><Item>First Collection </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/2"}><Item>Washington Post </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/3"}><Item>CS Monitor </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/4"}><Item>USA Today </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Item>With Entities: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Item>With Themes: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Item>Publication Country: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Publication State: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Detected Primary Language: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Detected Subject State: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Media Type: </Item>
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
}