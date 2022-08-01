// React
import React from "react";

// information from store
import { selectCurrentUser } from './authSlice';
import { useSelector } from 'react-redux';


const Account = () => {
  const currentUser = useSelector(selectCurrentUser);
  const fontStyle = {
    fontFamily: 'Courier',
    fontSize: "18px"
  }
  return (
    <div style={{ paddingTop: "200px" }}>
      <h1 style={fontStyle}>Account Username: {currentUser.username}</h1>
      <h1 style={fontStyle}>Email: {currentUser.email}</h1>
      <h1 style={fontStyle}>isStaff: {currentUser.isStaff.toString()}</h1>
      <h1 style={fontStyle}>isSuperUser: {currentUser.isSuperuser.toString()}</h1>
    </div>
  );
}

export default Account;
