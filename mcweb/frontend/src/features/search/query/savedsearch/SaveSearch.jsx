import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useCreateSavedSearchMutation } from '../../../../app/services/savedsearchApi';
import urlSerializer from '../../util/urlSerializer';

export default function SaveSearch() {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const queryState = useSelector((state) => state.query);
  const [createSavedSearch] = useCreateSavedSearchMutation();

  const handleSaveSearch = async () => {
    const serializedSearch = `https://search.mediacloud.org/search?${urlSerializer(queryState)}`;
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
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Save Search...
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Save Your Search</DialogTitle>
        <DialogContent>
          Name Your search, so you can remember what it is later. Once you save it, you will be able to load this search
          again by clicking the &quot;Load Saved Search&quot; button.
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
