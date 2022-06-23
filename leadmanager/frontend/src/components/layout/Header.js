
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




// Router 
import { useParams, useNavigate, NavLink, Outlet, Link } from 'react-router-dom'

function handleAccount(e) {
  e.preventDefault();
}



// future thoughts: might want to collapse these two functions into one
// why? userStatus and the userButtonStatus are in the same 



// printing out name 
function userStatus(user) {
  // if user is logged in display account 
  if (user.isLoggedIn) {
    return "Hello " + user.first_name + "!"
  }
  else {
    return "Sign in"
  }
}

// user account status (login, account info ...)
function userButtonStatus(user) {
  if (user.isLoggedIn) {
    return (
      <Button
        type='submit'
        style={{ backgroundColor: "white" }}
        variant='contained'
        sx={{ my: 2.25, color: 'black', display: 'block' }}
        component={Link}
        to="/Account"
      >
        Account
      </Button>)
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
      <AppBar position="fixed" style={{ backgroundColor: "purple" }}>
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
              <h1
                style={{
                  paddingTop: "10px",
                  mr: 1,
                  display: { xs: 'none', md: 'flex' },
                  fontFamily: 'Courier',
                  fontSize: "16px",
                  letterSpacing: '.06rem',
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                {/* Changing this so when the user is not logged in they will see a sign in button */}
                {userStatus(currentUser)}
              </h1>


              {/* Changing button to and impleneting navigate() from Router */}
              <form onSubmit={handleAccount}>
                {userButtonStatus(currentUser)}
              </form>

            </Box>


          </Toolbar>
        </Container >
      </AppBar >
      <Outlet />
    </div>

  );
};
export default ResponsiveAppBar;