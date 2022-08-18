import * as React from 'react';
import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { useSelector, useDispatch } from 'react-redux'
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

export default function Source() {
    const store = useSelector((store) => store);

    const {
        data,
        isLoading,
        isSuccess,
        isError,
        error,
    } = useGetSourceAndAssociationsQuery(1);

    // const {
    //   data,
    //   isLoading,
    //   isSuccess,
    //   isError,
    //   error,
    // } = useGetCollectionAndAssociationsQuery(1);

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
        console.log(data)
        // dispatch(setSourceCollectionsAssociations(data))
        // makeSourceCollectionAssociation(newAssoc)
        //   .then(dispatch(setSourceCollectionAssociation(newAssoc)))
    }, []);
    return (
        <div style={{ paddingTop: "100px" }}>
            <h1>SOURCE EDIT</h1>
            <Box sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Total Stories: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Covered Since: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Collections: </Item>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Item>Stories per Day: </Item>
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
                <button onClick={() => (
                    makeSourceCollectionAssociation(newAssoc)
                        .then(results => dispatch(setSourceCollectionAssociation(results.data)))
                )}>Click Me to make new association</button>

                <button onClick={() => (
                    dispatch(setSourceCollectionsAssociations(data))
                    // console.log(store)
                )}>
                    Get associations
                </button>

                <button onClick={() => (
                    deleteSourceCollectionAssociation(deleteAssoc)
                        .then(results => dispatch(dropSourceCollectionAssociation(results)))
                    // dispatch(setSourceCollectionsAssociations(data)),

                )}>
                    Delete associations
                </button>
            </Box>
        </div>
    );
}