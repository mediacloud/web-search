import React, { Component, Fragment } from 'react'
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Login from './Login'
import { selectCurrentUser } from '../../services/userApi';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

const theme = createTheme();

const Homepage = () => {


    return (

        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <Header />
                <div style={{paddingTop: "100px", paddingBottom: "100px"}}>
                    <Login />
                </div>

            </Container>
        </ThemeProvider>


    );
}

export default Homepage
