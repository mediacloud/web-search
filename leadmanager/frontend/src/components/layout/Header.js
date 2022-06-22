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

import { Link } from 'react-router-dom';




function handleSubmitLogin(e) {
  e.preventDefault();
  console.log('Login');
}





const ResponsiveAppBar = () => {



  const pages = ['Explorer', 'Topic Mapper', 'Source Manager'];

  const currentUser = useSelector(selectCurrentUser);


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

            <Button
              style={{ backgroundColor: "white", }}
              variant='contained'
              sx={{ my: 2.25, color: 'black', display: 'block' }
              }
            >
              <Link to ="/Account">Account</Link>
            </Button>
          </Box>


        </Toolbar>
      </Container >
    </AppBar >
  );
};
export default ResponsiveAppBar;