import React from 'react';
import PropTypes from 'prop-types';

function UserQuotaTable({ currentUser }) {
  return (
    <div className="container">
      <h1>Search Quotas</h1>
      <table className="col-12">
        <thead>
          <tr className="row">
            <th className="col-4">Week</th>
            <th className="col-4">Platform</th>
            <th className="col-4"># of hits</th>
          </tr>
        </thead>
        <tbody>
          {currentUser.quota.map((quota) => (
            <tr key={`${quota.week}+${quota.provider}`} className="row">
              <td className="col-4">{quota.week}</td>
              <td className="col-4">{quota.provider}</td>
              <td className="col-4">{quota.hits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

UserQuotaTable.propTypes = {
  currentUser: PropTypes.shape({
    quota: PropTypes.arrayOf(PropTypes.shape({
      week: PropTypes.string,
      provider: PropTypes.string,
      hits: PropTypes.number,
    })),
  }).isRequired,
};

export default UserQuotaTable;
