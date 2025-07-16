import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink, Link } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import dayjs from 'dayjs';
import UserMenu from './UserMenu';
import { assetUrl } from '../ui/uiUtil';
import { PermissionedStaff, ROLE_STAFF } from '../auth/Permissioned';
import SystemAlert from './SystemAlert';
import releases from '../about/release_history.json';

const relativeTime = require('dayjs/plugin/relativeTime');

const pages = ['search', 'directory'];

function Header() {
  dayjs.extend(relativeTime);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const { notes, date } = releases[0];

  return (
    <>
      <div id="header">
        <div className="container">
          <div className="row">
            <div className="col-6">

              <Link to="/">
                <img src={assetUrl('img/mediacloud-logo-white-2x.png')} alt="Media Cloud logo" width={40} height={40} />
              </Link>

              <ul>
                {pages.map((page) => (
                  <li key={page}>
                    <NavLink to={page} key={page} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                      <Button variant="text">{page}</Button>
                    </NavLink>
                  </li>
                ))}
                <li>
                  <Button>
                    <a href="https://vitals.mediacloud.org" target="_blank" rel="noreferrer">
                      Vitals
                    </a>
                  </Button>
                  <Button onClick={handleClick}>About</Button>
                  <Menu
                    id="about-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    sx={{ marginTop: 5 }}
                  >
                    <div className="container" style={{ marginLeft: 5 }}>
                      <div className="row">
                        <h5 className="col-8">Recent Changes</h5>
                        <p className="col-4" style={{ color: '#e5e5e5' }}>
                          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                          {dayjs(date).fromNow()}
                        </p>
                      </div>
                      <Divider />
                      {/* <br /> */}
                      <div className="row" style={{ paddingTop: 10 }}>
                        <Chip className="col-2" label="new" color="success" />
                        <p className="col-10">{notes[0]}</p>
                      </div>
                      <Divider />
                    </div>
                    <Link
                      to="release-notes"
                      onClick={handleClose}
                      style={{ textDecoration: 'none', color: 'black' }}
                    >
                      <MenuItem>
                        Read More Release Notes
                      </MenuItem>
                    </Link>
                    <a
                      href="https://www.mediacloud.org/documentation/search-tool-guide"
                      target="_blank"
                      onClick={handleClose}
                      style={{ textDecoration: 'none', color: 'black' }}
                      rel="noreferrer"
                    >
                      <MenuItem>
                        About Search API
                      </MenuItem>
                    </a>
                  </Menu>
                </li>
              </ul>

            </div>
            <div className="col-6">
              <div id="menuButtonWrapper" className="float-end">
                <PermissionedStaff role={ROLE_STAFF}>
                  { /* need to do an a link here to a new window so that it does
                    NOT go throug hthe Router */ }
                  <a href="/adminauth/user/" target="_blank">
                    <Button variant="text" startIcon={<LockOpenIcon titleAccess="admin only" />}>Admin</Button>
                  </a>
                </PermissionedStaff>
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </div>
      <SystemAlert />
    </>
  );
}

export default Header;
