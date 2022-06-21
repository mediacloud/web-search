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

  const currentUser = useSelector(selectCurrentUser);

  console.log(currentUser.isLoggedIn)

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <div>
          <Toolbar>


            <Typography
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


            <div style={{
              display: "flex",

            }}>
              <form>
                <Button variant="contained"
                  type="submit" style={{
                    backgroundColor: "orange", fontFamily: 'Courier',
                    fontWeight: 300,
                    letterSpacing: '.2rem',
                    color: 'white',
                    textDecoration: 'none'
                  }}
                  className="explorer"
                  onClick={handleSubmitLogin}
                >
                  Explorer
                </Button>
              </form>

              <form>
                <Button variant="contained"
                  type="submit"
                  style={{
                    backgroundColor: "green", fontFamily: 'Courier',
                    fontWeight: 300,
                    letterSpacing: '.2rem',
                    color: 'white',
                    textDecoration: 'none'
                  }}
                  className="topicMapper"
                  onClick={handleSubmitLogin}
                >
                  Topic Mapper
                </Button>
              </form>

              <form>


                <Button
                  variant="contained"
                  type="submit" style={{
                    backgroundColor: "blue", fontFamily: 'Courier',
                    fontWeight: 300,
                    letterSpacing: '.2rem',
                    color: 'white',
                    textDecoration: 'none'
                  }}
                  className="sourceManager"
                  onClick={handleSubmitLogin}
                >
                  Source Manager
                </Button>
              </form>

            </div>





          </Toolbar>

        </div>

      </Container >


    </AppBar >
  );
};
export default ResponsiveAppBar;