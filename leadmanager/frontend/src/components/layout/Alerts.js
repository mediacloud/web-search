import React, { Component, Fragment } from "react";
import { Stack, Alert, AlertTitle } from '@mui/material';
import { connect } from "react-redux"; // work with redux inside of a component 
import PropTypes from 'prop-types' // errors are going to come in as props 


export class Alerts extends Component {

    // requires a prop type 
    static propTypes = {
        error: PropTypes.object.isRequired
    }

    // whenever getError is run
    componentDidUpdate(prevProps) {
        //destructuring

        const { error } = this.props;
        if (error !== prevProps.error) {
            if (error.msg.name) { // join is used because it's an array 
                console.log(`Name: ${error.msg.name.join()}`);
            }
            if (error.msg.email) {
                console.log(`Email: ${error.msg.email.join()}`);
            }
            if (error.msg.message) {
                console.log(`Message: ${error.msg.message.join()}`);
            }
        }

    }

    render() {
        return (
            // A common pattern in React is for a component to return multiple elements. 
            <Alert severity="warning">
                <AlertTitle>Warning</AlertTitle>Warning</Alert>
            )
    }
}


// It is called every time the store state changes.
const mapStateToProps = state => ({
    error: state.errors
})

export default connect(mapStateToProps)(Alerts);