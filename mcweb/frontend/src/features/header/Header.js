import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import {useSelector, useDispatch} from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { useLogoutMutation } from '../../app/services/authApi';
import { selectCurrentUser, selectIsLoggedIn, setCredentials } from '../auth/authSlice';
import { saveCsrfToken } from '../../services/csrfToken';
import UserMenu from './UserMenu';
import { assetUrl } from '../ui/uiUtil';

const pages = ['search', 'collections', 'sources'];
const settings = ['Account', 'Logout'];

const Header = () => (
  <div id="header">
    <div className="container">
      <div className="row">
        <div className="col-6">

          <img src={assetUrl("img/mediacloud-logo-white-2x.png")} alt="Media Cloud logo" width={40} height={40}/>

          <ul>
            {pages.map((page) => (
              <li key={page}>
                <NavLink to={page} key={page} className={({isActive}) => isActive ? 'active' : undefined}>
                  <Button variant="text">{page}</Button>
                </NavLink>
              </li>
            ))}
          </ul>

        </div>
        <div className="col-6">
          <div id="menuButtonWrapper" className="float-right">
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Header;
