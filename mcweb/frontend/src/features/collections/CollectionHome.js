import * as React from 'react';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
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
                        <Link to={"/collections/125"}><Item>Collection 125 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Link to={"/collections/129"}><Item>Collection 129 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Link to={"/collections/142001"}><Item>Collection 142001 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/2453107"}><Item>Collection 2453107 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/7796878"}><Item>Collection 7796878 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/8875024"}><Item>Collection 8875024 </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/collections/8875027"}><Item>Collection 8875027 </Item></Link>
                    </Grid>
                </Grid>
            </Box>

            {/* Update
            <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                component={Link}
                to="/collections/test-collection"
            >
                Test
            </Button> */}


        </div>
    );
}
