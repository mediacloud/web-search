import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  IconButton,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch } from 'react-redux';
import { addSavedSearch } from '../querySlice';
import { useListSavedSearchesQuery, useDeleteSavedSearchMutation } from '../../../../app/services/savedsearchApi';
import decodeSavedSearch from '../../util/decodeSavedSearch';

export default function LoadSavedSearches() {
  const { data } = useListSavedSearchesQuery();
  const [deleteSavedSearch] = useDeleteSavedSearchMutation();
  const dispatch = useDispatch();

  const handleDeleteClick = async (id) => {
    await deleteSavedSearch(id).unwrap();
  };

  const [open, setOpen] = useState(false);

  const handleButtonClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSerializedSearchClick = (url) => {
    window.location.href = url;
  };

  const handleLoadSavedSearch = (url) => {
    const queryObj = decodeSavedSearch(url);
    dispatch(addSavedSearch(queryObj));
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleButtonClick}>
        Load Saved Searches
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Saved Searches</DialogTitle>
        <DialogContent>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Load Search</th>
                <th>Delete Search</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((savedSearch) => (
                <tr key={savedSearch.id}>
                  <td>
                    <Button onClick={() => handleSerializedSearchClick(savedSearch.serialized_search)}>
                      {savedSearch.name}
                    </Button>
                  </td>
                  <td>
                    <IconButton
                      size="small"
                      aria-label="load"
                      onClick={() => handleLoadSavedSearch(savedSearch.serialized_search)}
                    >
                      <AddCircleIcon sx={{ color: '#d24527' }} />
                    </IconButton>
                  </td>
                  <td>
                    <IconButton
                      size="small"
                      aria-label="delete"
                      onClick={() => handleDeleteClick(savedSearch.id)}
                    >
                      <DeleteIcon sx={{ color: '#d24527' }} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
