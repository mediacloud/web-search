import * as React from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { CircularProgress } from '@mui/material';
import { useParams, Link, Outlet } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import urlSerializer from '../search/util/urlSerializer';
import { platformDisplayName, platformIcon } from '../ui/uiUtil';
import { defaultPlatformProvider, defaultPlatformQuery } from '../search/util/platforms';

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
              <Button variant="outlined" endIcon={<SearchIcon />}> 
                <a
                  href={`/search/${urlSerializer({
                    queryList: defaultPlatformQuery(source.platform),
                    anyAll: 'any',
                    negatedQueryList: [],
                    startDate: dayjs().subtract(35, 'day'),
                    endDate: dayjs().subtract(5, 'day'),
                    collections: [],
                    sources: [source],
                    platform: defaultPlatformProvider(source.platform),
                    advanced: false,
                  })}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search Content

                </a>
              </Button>
              <Button variant="outlined" endIcon={<HomeIcon />}>
                <a href={source.homepage} target="_blank" rel="noreferrer">Visit Homepage</a>
              </Button>
              <Button variant="outlined">
                <Link to={`/sources/${sourceId}/feeds`}>List Feeds</Link>
              </Button>
              <Permissioned role={ROLE_STAFF}>
                <Button variant="outlined" endIcon={<LockOpenIcon titleAccess="admin only" />}>
                  <Link to={`/sources/${sourceId}/edit`}>Edit</Link>
                </Button>
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
