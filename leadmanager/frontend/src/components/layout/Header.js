
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

const ResponsiveAppBar = () => {

  // all pages 
  const pages = ['Explorer', 'TopicMapper', 'SourceManager'];

  // currentUser 
  const currentUser = useSelector(selectCurrentUser);

  return (
    <div>
      <AppBar position="fixed" style={{ backgroundColor: "purple" }}>
        <Container maxWidth="xl">

          <Toolbar>
            <Typography
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'Courier',
                fontWeight: 500,
                letterSpacing: '.05rem',
                color: 'white',
                textDecoration: 'none',
              }}
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
                  to= {page}

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
                Hello {currentUser.first_name}!
              </h1>


              {/* Changing button to and impleneting navigate() from Router */}
              <form onSubmit={handleAccount}>
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