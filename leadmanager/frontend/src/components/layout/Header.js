import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';

// getting currentUser
import { selectCurrentUser } from '../../services/userApi';
import { useSelector } from 'react-redux';
import { style } from '@mui/system';





function handleSubmitLogin(e) {
  e.preventDefault();
  console.log('Login');
}







// what will be shown if the user is logged in? 
// There name in the headbar, "hello ..."
// logout button


// else, if they're not logged in: 
// sign in
// create an account under sign in 

// implementing router 

// prints out the status of the user 
function status(currentUser) {
  if (currentUser.isLoggedIn) {
    return (<h2 style={statusStyle}>Welcome back {currentUser.username}</h2>)
  }
  else {
    return (<h2 style={statusStyle}>You're not logged in :(</h2>)
  }
}




const ResponsiveAppBar = () => {



  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };




  const pages = ['Explorer', 'Topic Mapper', 'Source Manager'];
  const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

  const currentUser = useSelector(selectCurrentUser);

  console.log(currentUser.isLoggedIn)

  return (
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
                onClick={handleCloseNavMenu}
                sx={{ my: 2.25, color: 'black', display: 'block' }

                }
              >
                {page}
              </Button>
            ))}
            
          </Box>



          {/*Display of Account */}

          <Box sx={{ flexGrow: 0 }}>
            <Typography
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'Courier',
                fontWeight: 100,
                letterSpacing: '.05rem',
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Account

            </Typography>
          </Box>




        </Toolbar>


      </Container >


    </AppBar >
  );
};
export default ResponsiveAppBar;