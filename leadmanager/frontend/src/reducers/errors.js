
import { GET_ERRORS } from "../actions/types";
const initialState = {
    msg: {},
    status: null
};

export default function(state = initialState, action) {
    console.log('errors');
    switch(action.type) {
        case GET_ERRORS:
            return {
                msg: action.payload.msg,
                status: action.payload.status
            };
        default: 
            return state;
    }
}