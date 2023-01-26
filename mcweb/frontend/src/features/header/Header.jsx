import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { NavLink, Link } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import dayjs from 'dayjs';
import UserMenu from './UserMenu';
import { assetUrl } from '../ui/uiUtil';
import Permissioned, { ROLE_STAFF } from '../auth/Permissioned';
import SystemAlert from './SystemAlert';
import releases from '../../../static/about/release_history.json';
import ModalHelper from '../ui/ModalHelper';

const relativeTime = require('dayjs/plugin/relativeTime');

const pages = ['search', 'directory'];

function Header() {
  dayjs.extend(relativeTime);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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
                  <Button onClick={handleOpen}>About</Button>
                  <ModalHelper
                    buttonText="about"
                    open={open}
                    handleClose={handleClose}
                    className="container"
                  >
                    <div className="row">

                      <h2 className="col-8">Recent Changes</h2>
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
                  </ModalHelper>
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
