import React, { Component } from 'react'

export class Homepage extends Component {
    render() {
        const mystyle = {
            color: "blue",
            backgroundColor: "DodgerBlue", 
            padding: "10px",
            fontFamily: "Arial"
        };
        return (
            <div style={mystyle}> to Media Cloud</div>
        )
    }
}

export default Homepage