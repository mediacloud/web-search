import * as React from 'react';
import { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom';


const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.primary
}));

export default function CollectionHome() {

    return (
        <div style={{ paddingTop: "100px" }}>

            <h1>Collections Home</h1>
            <Box sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/1"}><Item>First Collection </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/2"}><Item>Second Collection </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/117"}><Item>Collection 117 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/118"}><Item>Collection 118 </Item></Link>
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