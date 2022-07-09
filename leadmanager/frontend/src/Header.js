import React from 'react'
import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { useLogoutMutation } from './app/services/authApi';
import { selectCurrentUser, selectIsLoggedIn, setCredentials } from './features/auth/authSlice';
import { useSelector } from 'react-redux';

// if you use a query, you would use lcoal compenent state to set the query parameter

// user account status (login, account info ...)
function userButtonStatus(isLoggedIn, user, logout, isLoading, dispatch, navigate) {

  // if user is logged in display account information
  if (isLoggedIn) {
  return (
    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>

    <Button
      style={{ backgroundColor: "white" }}
      variant='contained'
      sx={{ my: 2.25, color: 'black', display: 'block' }}
      disabled={isLoading}
      onClick={async () => {
        const result = await logout().unwrap();
        dispatch(setCredentials(null));
        navigate("/");
      }}
    >
      Logout
    </Button>

    <Button
      type='submit'
      style={{ backgroundColor: "white" }}
      variant='contained'
      sx={{ my: 2.25, color: 'black', display: 'block' }}
      component={Link}
      to="/account"
    >
      Account
    </Button>
    </Box >
  )
  } else {
  return (

    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
      <Button
        type='submit'
        style={{ backgroundColor: "white" }}
        variant='contained'
        sx={{ my: 2.25, color: 'black', display: 'block' }}
        component={Link}
        to="/sign-in"
      >
        Sign-In
      </Button>
      <Button
        type='submit'
        style={{ backgroundColor: "white" }}
        variant='contained'
        sx={{ my: 2.25, color: 'black', display: 'block' }}
        component={Link}
        to="/sign-up"
      >
        Sign Up
      </Button>
    </Box>

  )

  }

}

const ResponsiveAppBar = () => {
  // all pages
  const pages = ['collections', 'search'];
  // currentUser
  const currentUser = useSelector(selectCurrentUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const [logout, { isLoading }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const typographyStyle = {
    mr: 2,
    display: { xs: 'none', md: 'flex' },
    fontFamily: 'Courier',
    fontWeight: 500,
    letterSpacing: '.05rem',
    color: 'white',
    textDecoration: 'none',
  }

  return (
  <div>
    <AppBar position="absolute" style={{ backgroundColor: "purple" }}>
    <Container maxWidth="xl">

      <Toolbar>
      <Typography
        sx={typographyStyle}
      >
        Media Cloud Proof-of-Concept
      </Typography>

      {/*Button Display of Search and Collection */}

      <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
        {pages.map((page) => (
          <Button
            style={{ backgroundColor: "white" }}
            variant='contained'
            key={page}
            component={Link}
            to={page}
            sx={{ my: 2.25, color: 'black', display: 'block' }}
          >
            {page}
          </Button>
        ))}

      </Box>


      {/*Display of Account */}
      <Box sx={{ flexGrow: 0 }}>
        {/* Changing button to and impleneting navigate() from Router */}
        {userButtonStatus(isLoggedIn, currentUser, logout, isLoading, dispatch, navigate)}
      </Box>


      </Toolbar>
    </Container >
    </AppBar >
    <Outlet />
  </div>

  );
};
export default ResponsiveAppBar;
