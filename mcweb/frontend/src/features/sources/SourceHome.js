import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.primary
}));

export default function SourceHome() {

    return (
        <div className='sourceHome'>
            <div>
                <h1>Sources Home</h1>
            </div>

            <div className="sourceList">
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/1"}><Item>NYT </Item></Link>
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
                        <Link to={"/sources/6"}><Item>LA Times </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Link to={"/sources/7"}><Item>NY Post </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Link to={"/sources/8"}><Item>NY Daily News </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/9"}><Item>Chicago Tribune </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/10"}><Item>Chron </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/12"}><Item>Dallas News </Item></Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3} >
                        <Link to={"/sources/13"}><Item>Newsday </Item></Link>
                    </Grid>
                </Grid>
            </div>
        </div>
    );
}