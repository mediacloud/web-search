import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import PersonIcon from '@mui/icons-material/Person';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import { NavLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {useSelector, useDispatch} from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { useLogoutMutation } from '../../app/services/authApi';
import { selectIsLoggedIn, setCredentials } from '../auth/authSlice';
import { saveCsrfToken } from '../../services/csrfToken';
import { defaultMenuOriginProps } from '../ui/uiUtil';

const UserMenu = () => {
    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const isLoggedIn = useSelector(selectIsLoggedIn);
    const [logout] = useLogoutMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const handleLogout = async () => {
        const result = await logout().unwrap();
        dispatch(setCredentials(null));
        navigate("/");
        enqueueSnackbar("You've been logged out", { variant: 'success' });
        // need to save the new csrf Token
        saveCsrfToken();
        setAnchorElUser(null);
    };

    let content;
    if (isLoggedIn) {
      content = (
        <>
          <IconButton onClick={handleOpenUserMenu} color="contrast" aria-label="user"><PersonIcon /></IconButton>
          <Menu
              id="user-menu"
              open={Boolean(anchorElUser)}
              anchorEl={anchorElUser}
              {...defaultMenuOriginProps}
              keepMounted
              onClose={handleCloseUserMenu}
          >
            <MenuItem component={NavLink} to={"account"} onClick={handleCloseUserMenu}>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </>
      );
    } else {
      content = (
        <Link to="/sign-in"><Button color="contrast" variant="outlined">login</Button></Link>
      )
    }
    return content;
};

export default UserMenu;
