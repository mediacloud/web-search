// all the http requests 

import axios from "axios";
import { GET_LEADS, DELETE_LEAD } from "./types";

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

export const deleteLead = id => dispatch => {
    axios
        .delete(`/api/leads/${id}/`)
        .then((res) => {
            dispatch({
                type: DELETE_LEAD,
                payload: id,
            });
        })
        .catch((err) => console.log(err));
};