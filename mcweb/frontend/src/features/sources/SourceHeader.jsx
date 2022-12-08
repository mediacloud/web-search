import * as React from 'react';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { useParams, Link, Outlet } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';

export default function SourceHeader() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  const {
    data: source,
    isLoading,
  } = useGetSourceQuery(sourceId);

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  const PlatformIcon = platformIcon(source.platform);

  return (
    <>
      <div className="feature-area filled">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <span className="small-label">
                {platformDisplayName(source.platform)}
                {' '}
                Source #
                {sourceId}
              </span>
              <h1>
                <PlatformIcon fontSize="large" />
                &nbsp;
                {source.label || source.name}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="sub-feature">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <Button variant="outlined">
                <a href={source.homepage} target="_blank">Visit Homepage</a>
              </Button>
              <Permissioned role={ROLE_STAFF}>
                <>
                  <Button variant="outlined" endIcon={<LockOpenIcon />}>
                    <Link to={`/sources/${sourceId}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="outlined" endIcon={<LockOpenIcon />}>
                    <Link to={`/sources/${sourceId}/feeds`}>Manage Feeds</Link>
                  </Button>
                </>
              </Permissioned>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}

// SourceHeader.propTypes = {
//   sourceId: PropTypes.number.isRequired,
// };
