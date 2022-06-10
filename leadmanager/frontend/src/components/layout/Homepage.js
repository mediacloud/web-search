import React, { Component, Fragment } from 'react'
import Header from './Header';
import UserList from '../../features/profiles/UserList';




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

        const userListStyle = {
            backgroundColor: "white",
            padding: "40px", 
            color: "black"
        }

        return (
            <Fragment>
                <Header />
                <div style={divStyle} >
                    <h1 style={h1Style}>Welcome to Media Cloud</h1>
                </div>
                <UserList style={userListStyle}></UserList>
            </Fragment >

        )
    }
}

export default Homepage