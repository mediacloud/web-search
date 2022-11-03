// React
import React from 'react';
import { Container } from '@mui/material';

// information from store
import { useSelector } from 'react-redux';
import { selectCurrentUser } from './authSlice';

function Account() {
  const currentUser = useSelector(selectCurrentUser);
  const fontStyle = {
    fontFamily: 'Courier',
    fontSize: '18px',
  };
  return (
    <div style={{ paddingTop: '25px' }}>
      <Container maxWidth="xs">
        <h1 style={fontStyle}>
          Account Username:
          {currentUser.username}
        </h1>
        <h1 style={fontStyle}>
          Email:
          {currentUser.email}
        </h1>
        <h1 style={fontStyle}>
          isStaff:
          {currentUser.isStaff.toString()}
        </h1>
        <h1 style={fontStyle}>
          isSuperUser:
          {currentUser.isSuperuser.toString()}
        </h1>
      </Container>
    </div>

  );
}

export default Account;
