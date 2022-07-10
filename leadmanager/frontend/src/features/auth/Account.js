// React
import React from "react";

// information from store
import { selectCurrentUser } from './authSlice';
import { useSelector } from 'react-redux';


const Account = () => {
  const currentUser = useSelector(selectCurrentUser);
  const fontStyle = {
    fontFamily: 'Courier',
  }
  return (
    <div style={{ paddingTop: "200px" }}>
      <h1 style={fontStyle}>Account Username: {currentUser.username} </h1>
      <h2 style={fontStyle}>Email: {currentUser.email}</h2>
      <h2 style={fontStyle}>isStaff: {currentUser.isStaff.toString()}</h2>
      <h2 style={fontStyle}>isSuperUser: {currentUser.isSuperuser.toString()}</h2>
    </div>
  );
}

export default Account;
