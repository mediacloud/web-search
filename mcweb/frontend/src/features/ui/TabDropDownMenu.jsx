import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import CircleIcon from '@mui/icons-material/Circle';
import PropTypes from 'prop-types';
import ArrowRight from '@mui/icons-material/ArrowRight';

// https://medium.com/geekculture/creating-a-dropdown-with-nested-menu-items-using-react-mui-bb0c084226da was a helpful tool

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
      {/* Original Menu with Options */}
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
        open={colorSubMenuOpen && open}
        anchorEl={colorSubMenuAnchorEl}
        onMouseOver={() => setColorSubMenuOpen(true)}
        onMouseLeave={() => setColorSubMenuOpen(false)}
        anchorOrigin={{
          vertical: 'right',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
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
            setColorSubMenuOpen(false);
            handleClose('yellow');
          }}
          >
            <CircleIcon sx={{ color: 'yellow' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            setColorSubMenuOpen(false);
            handleClose('green');
          }}
          >
            <CircleIcon sx={{ color: 'green' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            setColorSubMenuOpen(false);
            handleClose('blue');
          }}
          >
            <CircleIcon sx={{ color: 'blue' }} />
          </MenuItem>

          <MenuItem onClick={() => {
            setColorSubMenuOpen(false);
            handleClose('indigo');
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
