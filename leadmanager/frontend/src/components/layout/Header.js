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



const loginButtonStyle = {
  leftPadding: "500px",
  backgroundColor: "orange",
}

const signOutButtonStyle = {
  backgroundColor: "green",
}

function handleSubmitLogin(e) {
  e.preventDefault();
  console.log('Login');
}


function handleSubmitSignOut(e) {
  e.preventDefault();
  console.log('Sign Out');
}
const ResponsiveAppBar = () => {

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <div>
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'Courier',
                fontWeight: 300,
                letterSpacing: '.2rem',
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Media Cloud Proof-of-Concept
            </Typography>

            <form onSubmit={handleSubmitLogin}>
              <Button variant="contained" type="submit" style={loginButtonStyle}>Login</Button>
            </form>

            <form onSubmit={handleSubmitSignOut}>
              <Button variant="contained" type="submit" style={signOutButtonStyle}>Sign Out</Button>
            </form>
          </Toolbar>

        </div>
        
      </Container>
    </AppBar >
  );
};
export default ResponsiveAppBar;