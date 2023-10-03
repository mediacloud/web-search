import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import CircleIcon from '@mui/icons-material/Circle';
import PropTypes from 'prop-types';
import ArrowRight from '@mui/icons-material/ArrowRight';
import CloseIcon from '@mui/icons-material/Close';

// https://medium.com/geekculture/creating-a-dropdown-with-nested-menu-items-using-react-mui-bb0c084226da was a helpful tool

export default function TabDropDownMenuItems({
  anchorEl, open, handleClose, handleMenuOpen,
}) {
  const [colorSubMenuOpen, setColorSubMenuOpen] = useState(false);

  const handleMouseEnter = () => {
    setColorSubMenuOpen(true);
  };

  const closeColorSubMenu = (event, color) => {
    handleClose(color);
    setColorSubMenuOpen(false);
  };

  // mouse leaves main menu
  const handleMouseLeave = () => {
    setColorSubMenuOpen(false);
  };
  return (
    <div>
      <MoreVertIcon
        aria-label="options"
        onClick={(event) => handleMenuOpen(event)}
        sx={{
          position: 'absolute', top: '.25rem', right: '0', fontSize: 'medium',
        }}
      />
      {/* Main Menu with Options */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {/* Add Color Option */}
        <MenuItem
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Add Color
          <ArrowRight />
        </MenuItem>
        {/* Edit Tab Name Option */}
        <MenuItem onClick={() => {
          handleClose('edit');
          setColorSubMenuOpen(false);
        }}
        >
          Edit Tab Name
        </MenuItem>
      </Menu>

      {/* Color Submenu */}
      <Menu
        hideBackdrop
        style={{ pointerEvents: 'none' }}
        open={colorSubMenuOpen && open && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onMouseEnter={() => {
          if (colorSubMenuOpen && open && Boolean(anchorEl)) {
            setColorSubMenuOpen(true);
          }
        }}
        onMouseLeave={handleMouseLeave}
        anchorOrigin={{
          vertical: 'right',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: -15,
          horizontal: -122.5,
        }}
      >
        <div style={{ pointerEvents: 'all' }}>
          <MenuItem onClick={(e) => closeColorSubMenu(e, 'orange')}>
            <CircleIcon sx={{ color: 'orange' }} />
          </MenuItem>

          <MenuItem onClick={(e) => closeColorSubMenu(e, 'yellow')}>
            <CircleIcon sx={{ color: 'yellow' }} />
          </MenuItem>

          <MenuItem onClick={(e) => closeColorSubMenu(e, 'green')}>
            <CircleIcon sx={{ color: 'green' }} />
          </MenuItem>

          <MenuItem onClick={(e) => closeColorSubMenu(e, 'blue')}>
            <CircleIcon sx={{ color: 'blue' }} />
          </MenuItem>

          <MenuItem onClick={(e) => closeColorSubMenu(e, 'indigo')}>
            <CircleIcon sx={{ color: 'indigo' }} />
          </MenuItem>
          <MenuItem onClick={(e) => closeColorSubMenu(e, 'white')}>
            <CloseIcon />
          </MenuItem>
        </div>
      </Menu>
    </div>
  );
}

TabDropDownMenuItems.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  anchorEl: PropTypes.any.isRequired, // either null or svg
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleMenuOpen: PropTypes.func.isRequired,
};
