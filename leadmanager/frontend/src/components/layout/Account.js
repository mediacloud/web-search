import React from "react";

//getting information from store
import { selectCurrentUser } from '../../services/userApi';
import { useSelector } from 'react-redux';


// router
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";


const Account = () => {
    const currentUser = useSelector(selectCurrentUser);


    const fontStyle = {
        fontFamily: 'Courier',
    }
    return (
        <>
                <h1 style={fontStyle}>Account Username: {currentUser.username} </h1>
                <h2 style={fontStyle}>Email: {currentUser.email}</h2>
                <h2 style={fontStyle}>isStaff: {currentUser.is_staff.toString()}</h2>
                <h2 style={fontStyle}>isSuperUser: {currentUser.is_superuser.toString()}</h2>
        </>
    );
}

export default Account
