import React, { Component, Fragment } from 'react'
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Login from './Login'
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


    const currentUser = useSelector(selectCurrentUser);
    console.log(currentUser);

    return (
        <>
            <Header />
            {/* <div style={divStyle} >
                <h1 style={h1Style}>Welcome to Media Cloud</h1>
                {currentUser.isLoggedIn && (<h3>Welcome back {currentUser.username}</h3>)}
                {!currentUser.isLoggedIn && (<h3>You're not logged in</h3>)}
                <Link to="/header" style={linkStyle}>Header</Link>
                <Link to="/profiles" style={linkStyle}>Profiles</Link >
            </div> */}

            <Login />
        </>

    );
}

export default Homepage
