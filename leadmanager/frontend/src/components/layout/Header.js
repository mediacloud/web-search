
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
          href="accounts/logout"
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





  return (
    <div>
      <AppBar position="absolute" style={{ backgroundColor: "purple" }}>
        <Container maxWidth="">
          <Toolbar disableGutters>

            <Typography
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'Courier',
                letterSpacing: '.05rem',
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Media Cloud Proof-of-Concept
            </Typography>

            {/* Search and Collection */}

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




            {/* Account */}

            <Box sx={{ flexGrow: 0 }}>
              {userButtonStatus(currentUser)}
            </Box>



            {/* Display is xs  */}

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />

            <Typography
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'Courier',
                letterSpacing: '.05rem',
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Media Cloud
            </Typography>

          </Toolbar>
        </Container >
      </AppBar >
      <Outlet />
    </div >

  );
};
export default ResponsiveAppBar;