import React, { Component, Fragment } from 'react'
import Header from './Header';
import UserList from '../../features/profiles/UserList';
import { Outlet, Link } from 'react-router-dom';




export class Homepage extends Component {
    render() {
        const divStyle = {
            backgroundColor: "orange",
            height: "700px"
        };

        const h1Style = {
            color: "blue",
            padding: "30px",
        }

        const linkStyle = {
            color: "black",
            padding: "30px"
        }




        return (
            <Fragment>
                <Header />
                <div style={divStyle} >

                    <h1 style={h1Style}>Welcome to Media Cloud</h1>
                    <Link to="/header" style={linkStyle}>Header</Link>
                    <Link to="/profiles" style={linkStyle}>Profiles</Link >
                </div>
            </Fragment >

        )
    }
}

export default Homepage