import * as React from 'react';
import Button from '@mui/material/Button';
import { NavLink, Link } from 'react-router-dom';
import UserMenu from './UserMenu';
import { assetUrl } from '../ui/uiUtil';

const pages = ['search', 'collections', 'sources'];
// const settings = ['Account', 'Logout'];

function Header() {
  return (
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
            </ul>

          </div>
          <div className="col-6">
            <div id="menuButtonWrapper" className="float-end">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
