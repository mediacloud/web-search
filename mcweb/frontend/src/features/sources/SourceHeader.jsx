import * as React from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import { Outlet, useParams } from 'react-router-dom';
import { useGetSourceQuery } from '../../app/services/sourceApi';

export default function SourceHeader() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const {
    data,
    isLoading,
  } = useGetSourceQuery(sourceId);
  const source = data;

  if (isLoading) {
    return (
      <div>
        {' '}
        <CircularProgress size="75px" />
        {' '}
      </div>
    );
  }

  return (
    <div className="collectionHeader">
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <span className="small-label">
                {source.platform}
                {' '}
                Source #
                {sourceId}
              </span>
              <h1>
                {source.label}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

SourceHeader.propTypes = {
  sourceId: PropTypes.number.isRequired,
};
