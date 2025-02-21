import React from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@mui/material/CircularProgress';
import { selectCurrentUser } from '../auth/authSlice';
import { useGetUserQuotasQuery } from '../../app/services/authApi';

function UsersQuotas() {
  const currentUser = useSelector(selectCurrentUser);
  if (!currentUser.isStaff) {
    return <div>Not authorized</div>;
  }

  const { data, error, isLoading } = useGetUserQuotasQuery();

  if (isLoading) {
    return (<div><CircularProgress size="75px" /></div>);
  }
  if (error) {
    return <div>{error}</div>;
  }
  console.log(data);
  return (
    <div>
      <h1>Users Quotas</h1>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Provider</th>
            <th>Hits</th>
            <th>Week</th>
          </tr>
        </thead>
        <tbody>
          {data.map((quota) => (
            <tr key={quota.email}>
              <td>{quota.user}</td>
              <td>{quota.email}</td>
              <td>{quota.provider}</td>
              <td>{quota.hits}</td>
              <td>{quota.week}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersQuotas;
