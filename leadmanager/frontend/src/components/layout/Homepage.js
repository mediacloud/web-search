import React, { Component, Fragment } from 'react'


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
}

export default Homepage