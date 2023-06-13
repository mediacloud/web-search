import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useCreateSavedSearchMutation } from '../../../../app/services/savedsearchApi';
import urlSerializer from '../../util/urlSerializer';

export default function SaveSearch({ queryIndex }) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const queryObject = useSelector((state) => state.query[queryIndex]);
  const serializedSearch = `https://search.mediacloud.org/search?${urlSerializer([queryObject])}`;
  const [createSavedSearch] = useCreateSavedSearchMutation();

  const handleSaveSearch = async () => {
    await createSavedSearch({ name, serializedSearch });
    setOpen(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setName('');
    setOpen(false);
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Save Search
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Save Search</DialogTitle>
        <DialogContent>
          <TextField label="Search Name" value={name} onChange={handleNameChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveSearch}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
SaveSearch.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
