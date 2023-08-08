import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Popover from '@mui/material/Popover'; // Import Popover
import CircleIcon from '@mui/icons-material/Circle';
import EditIcon from '@mui/icons-material/Edit';
import PropTypes from 'prop-types';
import ArrowRight from '@mui/icons-material/ArrowRight';

export default function MoreVertIconWrapper({
  anchorEl, open, handleClose, handleMenuOpen,
}) {
  const [colorSubMenuOpen, setColorSubMenuOpen] = useState(false);
  const [colorSubMenuAnchorEl, setColorSubMenuAnchorEl] = useState(null);

  const handleMouseEnter = (event) => {
    setColorSubMenuAnchorEl(event.currentTarget);
    setColorSubMenuOpen(true);
  };

  const handleMouseLeave = () => { setColorSubMenuOpen(false); };
  return (
    <div>
      <MoreVertIcon
        aria-label="options"
        onClick={(event) => handleMenuOpen(event)}
        sx={{
          position: 'absolute', top: '.25rem', right: '0', fontSize: 'medium',
        }}
      />
      {/* Dropdown Menu Items */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Choose Color
          <ArrowRight />
        </MenuItem>
        <MenuItem onClick={() => {
          handleClose('edit');
          setColorSubMenuOpen(false);
        }}
        >
          <EditIcon aria-label="edit" />
        </MenuItem>
      </Menu>

      {/* Color Submenu using Popover */}
      <Menu
        hideBackdrop
        style={{ pointerEvents: 'none' }}
        open={colorSubMenuOpen}
        anchorEl={colorSubMenuAnchorEl}
        onMouseOver={() => setColorSubMenuOpen(true)}
        onMouseLeave={() => setColorSubMenuOpen(false)}
        anchorOrigin={{
          vertical: 'right',
          horizontal: 'right',
        }}
      >
        <div style={{ padding: '10px', pointerEvents: 'auto' }}>
          <MenuItem onClick={() => {
            handleClose('orange');
            setColorSubMenuOpen(false);
          }}
          >
            <CircleIcon sx={{ color: 'orange' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            handleClose('yellow');
            setColorSubMenuOpen(false);
          }}
          >
            <CircleIcon sx={{ color: 'yellow' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            handleClose('green');
            setColorSubMenuOpen(false);
          }}
          >
            <CircleIcon sx={{ color: 'green' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            handleClose('blue');
            setColorSubMenuOpen(false);
          }}
          >
            <CircleIcon sx={{ color: 'blue' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            handleClose('indigo');
            setColorSubMenuOpen(false);
          }}
          >
            <CircleIcon sx={{ color: 'indigo' }} />
          </MenuItem>
        </div>
      </Menu>
    </div>
  );
}

MoreVertIconWrapper.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  anchorEl: PropTypes.any.isRequired, // either null or svg
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleMenuOpen: PropTypes.func.isRequired,
};
