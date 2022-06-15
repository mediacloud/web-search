/*

getCsrfToken gets a CSRF Token from the csrf view and caches it . 

testREquest makes an AJAX request to the ping view. If it's a POST request, 
then testRequests adds the CSRF token in a X_CSRFToken header, as expected by Django 

TEst triggers a GET Request and a POST request when it loads.

*/

import React, { Component } from 'react'


const API_HOST = 'http://localhost:8000';
let _csrfToken = null;

async function getCsrfToken() {
    if (_csrfToken === null) {
        const response = await fetch(`${API_HOST}/csrf/`, {
            credentials: 'include',
        });
        const data = await response.json();
        _csrfToken = data.csrfToken;
    }
    return _csrfToken;
}

async function testRequest(method) {
    const response = await fetch(`${API_HOST}/ping/`, {
        method: method,
        headers: (
            method === 'POST'
                ? { 'X-CSRFToken': await getCsrfToken() }
                : {}
        ),
        credentials: 'include',
    });
    const data = await response.json();
    
    return data.result;

}


export class Test extends Component {

    constructor(props) {
        super(props);
        this.state = {
            testGet: 'KO',
            testPost: 'KO',
        };
    }

    async componentDidMount() {
        this.setState({
            testGet: await testRequest('GET'),
            testPost: await testRequest('POST'),
        });
    }

    render() {
        return (
            <div>
                <p>Test GET request: {this.state.testGet}</p>
                <p>Test POST request: {this.state.testPost}</p>
            </div>
        );
    }
}

export default Test;