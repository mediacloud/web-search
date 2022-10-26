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
import { useLogoutMutation } from './app/services/authApi';
import { selectCurrentUser, selectIsLoggedIn, setCredentials } from './features/auth/authSlice';
import { saveCsrfToken } from './services/csrfToken';
import { NavLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';



const pages = ['sources', 'collections', 'search'];
const settings = ['Account', 'Logout'];

const Header = () => {
    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const currentUser = useSelector(selectCurrentUser);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const [logout, { isLoading }] = useLogoutMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = async () => {
        const result = await logout().unwrap();
        dispatch(setCredentials(null));
        navigate("/");
        enqueueSnackbar("You've been logged out", { variant: 'success' });
        // need to save the new csrf Token
        saveCsrfToken();
        setAnchorElUser(null);
    };
    

    let activeStyle = {
        textDecoration: "underline", 
        color: 'white', 
        display: 'block', 
        fontSize: '1.25rem', 
        padding:'.5rem',
        fontFamily:'PT Serif'
    };

    let notActiveStyle = {
        color: 'white', 
        display: 'block', 
        fontSize: '1.25rem', 
        padding: '.5rem',
        fontFamily: 'PT Serif'
    };

    let notActive = "not-active";

    let activeClassName = "underline";

    return (
        <AppBar position="static" sx={{ background: '#d24527'}} >
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Media Cloud
                    </Typography>

                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon sx={{color:"black"}} />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {pages.map((page) => (
                                <MenuItem key={page} component={NavLink} to={page} onClick={handleCloseNavMenu}>
                                    <Typography textAlign="center">{page}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                    <Typography
                        variant="h5"
                        noWrap
                        component="a"
                        href=""
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Media Cloud
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        {pages.map((page) => (
                            // <Button
                            //     key={page}
                            //     component={NavLink}
                            //     to={page}
                            //     sx={{ my: 2, color: 'white', display: 'block' }}
                            // >
                            //     {page}
                            // </Button>
                            <NavLink 
                                key={page}
                                to={page}
                                style={({ isActive }) =>
                                    isActive ? activeStyle : notActiveStyle
                                }
                                className={({ isActive }) =>
                                    isActive ? activeClassName : notActive
                                }
                                 >
                                {page.toUpperCase()}
                            </NavLink>
                        ))}
                    </Box>

                    <Box sx={{ flexGrow: 0 }}>
                        <Tooltip title="Open settings">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            {isLoggedIn && (
                                <div>
                                    <MenuItem component={NavLink} to={"account"} onClick={handleCloseUserMenu}>
                                        <Typography textAlign="center">Account</Typography>
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout}>
                                        <Typography textAlign="center">Log Out</Typography>
                                    </MenuItem>
                                </div>
                            )}
                            {!isLoggedIn && (
                                <div>
                                    <MenuItem component={NavLink} to={"sign-in"} onClick={handleCloseUserMenu}>
                                        <Typography textAlign="center">Sign In</Typography>
                                    </MenuItem>
                                    <MenuItem component={NavLink} to={"sign-up"} onClick={handleCloseUserMenu}>
                                        <Typography textAlign="center">Sign Up</Typography>
                                    </MenuItem>
                                </ div>
                            )}

                           
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};
export default Header;