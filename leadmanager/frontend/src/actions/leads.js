// all the http requests 

import axios from "axios";
import { GET_LEADS } from "./types";

// GET LEADS 
// asynchronous request 
// dispatch an action 
export const getLeads = () => dispatch => {
    axios
    .get('/api/leads/')
    .then(res => {
        dispatch({
            type: GET_LEADS,
            payload: res.data
        });
    })
    .catch(err => console.log(err));
};