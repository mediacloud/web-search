
// React 
import React from 'react'
import { useState } from 'react';

// Mui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';


// getting currentUser, setLogin
import { selectCurrentUser } from '../../services/userApi';
import { useSelector } from 'react-redux';




// Router 
import { Outlet, Link } from 'react-router-dom'



// if you use a query, you would use lcoal compenent state to set the query parameter 


// user account status (login, account info ...)
function userButtonStatus(user) {
 
  // if user is logged in display account information 
  if (user.isLoggedIn) {
    return (
      <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>

        <Button
          type='submit'
          style={{ backgroundColor: "white" }}
          variant='contained'
          sx={{ my: 2.25, color: 'black', display: 'block' }}
          href= "accounts/logout"
        >
          Logout
        </Button>

        <Button
          type='submit'
          style={{ backgroundColor: "white" }}
          variant='contained'
          sx={{ my: 2.25, color: 'black', display: 'block' }}
          component={Link}
          to="/Account"
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
          to="/Sign-In"
          onClick={() => {
            console.log('signin');
          }}
        >
          Sign In
        </Button>

        <Button
          type='submit'
          style={{ backgroundColor: "white" }}
          variant='contained'
          sx={{ my: 2.25, color: 'black', display: 'block' }}
          component={Link}
          to="/Sign-Up"
          onClick={() => {
            console.log('signup');
          }}
        >
          Sign Up
        </Button>
      </Box>
      
    )

  }

}

const ResponsiveAppBar = () => {

  // all pages 
  const pages = ['Collection', 'Search'];

  // currentUser 
  const currentUser = useSelector(selectCurrentUser);


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

                  sx={{ my: 2.25, color: 'black', display: 'block' }
                  }
                >
                  {page}
                </Button>
              ))}

            </Box>


            {/*Display of Account */}
            <Box sx={{ flexGrow: 0 }}>
              {/* Changing button to and impleneting navigate() from Router */}
              {userButtonStatus(currentUser)}
            </Box>


          </Toolbar>
        </Container >
      </AppBar >
      <Outlet />
    </div>

  );
};
export default ResponsiveAppBar;