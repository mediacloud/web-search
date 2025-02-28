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

  return (
    <div className="container">
      <h1>Users Quotas</h1>
      <table className="col-12">
        <thead>
          <tr className="row">
            <th className="col-2">User</th>
            <th className="col-3">Email</th>
            <th className="col-3">Provider</th>
            <th className="col-2">Hits</th>
            <th className="col-2">Week</th>
          </tr>
        </thead>
        <tbody>
          {data.map((quota) => (
            <tr className="row" key={`${quota.week}+${quota.provider}`}>
              <td className="col-2">{quota.user}</td>
              <td className="col-3">{quota.email}</td>
              <td className="col-3">{quota.provider}</td>
              <td className="col-2">{quota.hits}</td>
              <td className="col-2">{quota.week}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersQuotas;
