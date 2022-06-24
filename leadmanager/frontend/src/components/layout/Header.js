
// React 
import * as React from 'react';

// Mui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';


// getting currentUser
import { selectCurrentUser } from '../../services/userApi';
import { useSelector } from 'react-redux';



// componenets 
import SignIn from './SignIn'
import SignUp from './SignUp'


// Router 
import { useParams, useNavigate, NavLink, Outlet, Link } from 'react-router-dom'

function handleLogout(e) {
  e.preventDefault();

  console.log("Logout")
}



// future thoughts: might want to collapse these two functions into one
// why? userStatus and the userButtonStatus are in the same 




// user account status (login, account info ...)
function userButtonStatus(user) {
  // if user is logged in display account information 
  if (user.isLoggedIn) {
    return (
      <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>

        <form onSubmit={handleLogout}>
          <Button
            type='submit'
            style={{ backgroundColor: "white" }}
            variant='contained'
            sx={{ my: 2.25, color: 'black', display: 'block' }}
          >
            Logout
          </Button>
        </form>

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
  } else { // if user is not logged in show sign in button 
    return (

      <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
        <Button
          type='submit'
          style={{ backgroundColor: "white" }}
          variant='contained'
          sx={{ my: 2.25, color: 'black', display: 'block' }}
          component={Link}
          to="/SignIn"
        >
          Sign In
        </Button>

        <Button
          type='submit'
          style={{ backgroundColor: "white" }}
          variant='contained'
          sx={{ my: 2.25, color: 'black', display: 'block' }}
          component={Link}
          to="/SignUp"
        >
          Sign Up
        </Button>
      </Box>
    )

  }

}

const ResponsiveAppBar = () => {

  // all pages 
  const pages = ['Explorer', 'TopicMapper', 'SourceManager'];

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

            {/*Button Display of Explorer, Topic Mapper, and Source Manager */}

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