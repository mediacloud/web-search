import React, { Component, Fragment } from 'react'
import { Outlet, Link } from 'react-router-dom';
import Header from './Header';
import Login from './Login'
import Account from './Account';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

const theme = createTheme();


// Get user information 
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../services/userApi';




const Homepage = () => {

    const currentUser = useSelector(selectCurrentUser);

    return (

        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <Header />
                {/* <div style={{paddingTop: "100px", paddingBottom: "100px"}}>
                    <Login />
                </div> */}

            </Container>

            <h1 style={{paddingTop: "200px"}}>
                {currentUser.isLoggedIn.toString()}
            </h1>



        </ThemeProvider>


    );
}

export default Homepage
