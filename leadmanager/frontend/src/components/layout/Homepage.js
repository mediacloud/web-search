import React, { Component, Fragment } from 'react'
import Header from './Header';
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




        return (
            <Fragment>
                <Header />
                <div style={divStyle} >

                    <h1 style={h1Style}>
                        Welcome to Media Cloud
                    </h1>

                </div>
            </Fragment>

        )
    }
}

export default Homepage