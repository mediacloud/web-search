import React, { Component, Fragment } from 'react'
<<<<<<< HEAD
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import UserList from '../../features/profiles/UserList';
import { selectCurrentUser } from '../../services/userApi';



const Homepage = () => {
  const divStyle = {
      backgroundColor: "orange",
      height: "300px"
  };

  const h1Style = {
      color: "blue",
      padding: "30px",
  }

  const linkStyle = {
      color: "black",
      padding: "30px"
  }

  const userListStyle = {
      backgroundColor: "white",
      padding: "40px",
      color: "black"
  }

  const currentUser = useSelector(selectCurrentUser);
  console.log(currentUser);

  return (
      <Fragment>
          <Header />
          <div style={divStyle} >
              <h1 style={h1Style}>Welcome to Media Cloud</h1>
              {currentUser.isLoggedIn && (<h3>Welcome back {currentUser.username}</h3>)}
              {!currentUser.isLoggedIn && (<h3>You're not logged in</h3>)}
              <Link to="/header" style={linkStyle}>Header</Link>
              <Link to="/profiles" style={linkStyle}>Profiles</Link >

          </div>
          <UserList style={userListStyle}></UserList>
      </Fragment >

  );



import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import { Outlet, Link } from 'react-router-dom';

import UserList from '../../features/profiles/UserList';
import ResponsiveAppBar from './ResponsiveAppBar';



export class Homepage extends Component {
    render() {
       
       
        const divStyle = {
            backgroundColor: "orange",
            height: "700px",

        };

        const h1Style = {
            color: "blue",
            padding: "20px",
            fontFamily: "Courier"
        }

        const linkStyle = {
            color: "white",
            padding: "100px"
        }

       

        return (
            <Fragment>
                <ResponsiveAppBar />
                <div style={divStyle} >
                    <h1 style={h1Style}>Admin</h1>
                    <nav>
                        <Link to="/UserList" style={linkStyle}> UserList </Link>
                    </nav>
                    <Outlet />
                </div>

            </Fragment >

        )
    }
>>>>>>> 9309a066aeb15de4337e581541dce9c4854c8517
}

export default Homepage
