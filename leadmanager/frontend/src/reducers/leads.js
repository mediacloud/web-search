import { GET_LEADS, DELETE_LEAD } from '../actions/types.js';

const initialState = {
    leads: []
};


export default function (state = initialState, action) {
    switch (action.type) {
        case GET_LEADS:
            return {
                ...state,
                leads: action.payload
            };
        case DELETE_LEAD:
            return {
                // filters through all the data and if there is a similiar id it will delete 
                //(ex. searching for id 1, in (1,2,3), the first user will be deleted 
                ...state,
                leads: state.leads.filter(lead => lead.id !== action.payload)
            };
        default:
            return state;

    }
}