import React from 'react';
import { useSelector } from 'react-redux';

import Permissioned, { ROLE_STAFF } from './Permissioned';
import { selectCurrentUser } from './authSlice';

function Account() {
  const currentUser = useSelector(selectCurrentUser);
  return (
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h1>Profile</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="container profile">
        <dl>
          <dt>Account Username:</dt>
          <dd>{currentUser.username}</dd>
          <dt>Email:</dt>
          <dd>{currentUser.email}</dd>
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
