import React, { Component, Fragment } from 'react'
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Login from './Login'
import { selectCurrentUser } from '../../services/userApi';



const Homepage = () => {
    const divStyle = {
        paddingTop: "200px",
        paddingBotton: "200px",
    };

    const h1Style = {
        color: "blue",
        padding: "30px",
    }

    const linkStyle = {
        color: "black",
        padding: "30px"
    }

    const statusStyle = {
        paddingLeft: "100px",
    }

    function status(currentUser) {
        if(currentUser.isLoggedIn) {
            return (<h2 style = { statusStyle }>Welcome back {currentUser.username}</h2>)
        }
        else {
            return (<h2 style = { statusStyle }>You're not logged in :(</h2>)
        }

        // {currentUser.isLoggedIn && (<h3>Welcome back {currentUser.username}</h3>)}
        //{ !currentUser.isLoggedIn && (<h3>You're not logged in</h3>) }

    }


    const currentUser = useSelector(selectCurrentUser);
    console.log(currentUser);

    return (
        <>
            <Header />
             <div style={divStyle} >
                <h1 style={h1Style}>Welcome to Media Cloud</h1>
                {status(currentUser)} 
            </div> 

            <Login />
        </>

    );
}

export default Homepage
