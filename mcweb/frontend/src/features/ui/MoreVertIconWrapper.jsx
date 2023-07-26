import React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import CircleIcon from '@mui/icons-material/Circle';
import EditIcon from '@mui/icons-material/Edit';
import PropTypes from 'prop-types';

export default function MoreVertIconWrapper({
  anchorEl, open, handleClose, handleMenuOpen,
}) {
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
        <MenuItem onClick={() => handleClose('orange')}>
          <CircleIcon sx={{ color: 'orange' }} />
        </MenuItem>
        <MenuItem onClick={() => handleClose('yellow')}>
          <CircleIcon sx={{ color: 'yellow' }} />
        </MenuItem>
        <MenuItem onClick={() => handleClose('green')}>
          <CircleIcon sx={{ color: 'green' }} />
        </MenuItem>
        <MenuItem onClick={() => handleClose('blue')}>
          <CircleIcon sx={{ color: 'blue' }} />
        </MenuItem>
        <MenuItem onClick={() => handleClose('indigo')}>
          <CircleIcon sx={{ color: 'indigo' }} />
        </MenuItem>
        <MenuItem onClick={() => handleClose('edit')}>
          <EditIcon aria-label="edit" />
        </MenuItem>
      </Menu>
    </div>
  );
}

MoreVertIconWrapper.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  anchorEl: PropTypes.any.isRequired, // either null or svg
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleEdit: PropTypes.func.isRequired,
  handleMenuOpen: PropTypes.func.isRequired,
};
