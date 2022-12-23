import React from 'react';
import { useSelector } from 'react-redux';

import Permissioned, { ROLE_STAFF } from './Permissioned';
import { selectCurrentUser } from './authSlice';
import Header from '../ui/Header';

function Account() {
  const currentUser = useSelector(selectCurrentUser);
  return (
    <>
      <Header>
        <h1>Profile</h1>
      </Header>
      <div className="container profile">
        <dl>
          <dt>Account Username:</dt>
          <dd>{currentUser.username}</dd>
          <dt>Email:</dt>
          <dd>{currentUser.email}</dd>
          <dt>API Token:</dt>
          <dd>{currentUser.token}</dd>
          <Permissioned role={ROLE_STAFF}>
            <dt>Staff?</dt>
            <dd>{currentUser.isStaff ? 'yes' : 'no'}</dd>
            <dt>Super User?</dt>
            <dd>{currentUser.isSuperuser ? 'yes' : 'no'}</dd>
          </Permissioned>
        </dl>
      </div>
    </>
  );
}

export default Account;
