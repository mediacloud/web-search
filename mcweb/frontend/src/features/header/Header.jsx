import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import { NavLink, Link } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import dayjs from 'dayjs';
import UserMenu from './UserMenu';
import { assetUrl } from '../ui/uiUtil';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import SystemAlert from './SystemAlert';
import releases from '../../../static/about/release_history.json';

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
                        <h6 className="col-8">Recent Changes</h6>
                        <p className="col-4">
                          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                          {dayjs(date).fromNow()}
                        </p>
                      </div>
                      <Divider />
                      <div className="row">
                        <Chip className="col-2" label="new" color="success" />
                        <p className="col-10">{notes[0]}</p>
                      </div>
                      <Divider />
                      <Link to="release-notes" onClick={handleClose}>
                        Read More Release Notes
                      </Link>
                    </div>
                  </Menu>
                </li>
              </ul>

            </div>
            <div className="col-6">
              <div id="menuButtonWrapper" className="float-end">
                <Permissioned role={ROLE_STAFF}>
                  { /* need to do an a link here to a new window so that it does
                    NOT go throug hthe Router */ }
                  <a href="/adminauth/user/" target="_blank">
                    <Button variant="text" endIcon={<LockOpenIcon titleAccess="admin only" />}>Admin</Button>
                  </a>
                </Permissioned>
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
