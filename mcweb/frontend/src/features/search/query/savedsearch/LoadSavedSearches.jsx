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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch } from 'react-redux';
import { addSavedSearch } from '../querySlice';
import { useListSavedSearchesQuery, useDeleteSavedSearchMutation } from '../../../../app/services/savedsearchApi';
import decodeSavedSearch from '../../util/decodeSavedSearch';
import { setQueryState, setSearchQuery } from '../../util/setSearchQuery';

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

  // const handleSerializedSearchClick = (url) => {
  //   window.location.href = url;
  // };

  // const getDecodedQuery = (url) => {
  //   const queryObj = decodeSavedSearch(url);
  //   console.log(queryObj);
  //   return queryObj;
  // };

  const handleLoadSavedSearch = (url) => {
    const queryObj = decodeSavedSearch(url);
    setSearchQuery(queryObj, dispatch, true);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outlined" color="primary" onClick={handleButtonClick} endIcon={<MoreVertIcon />}>
        Load Saved Searches
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Saved Searches</DialogTitle>
        <DialogContent>
          <table>
            <thead>
              <tr>
                <th>Query Name</th>
                <th>Query</th>
                <th>Add Query</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((savedSearch) => (
                <tr key={savedSearch.id}>
                  <td>
                    {savedSearch.name}
                  </td>
                  {/* <td>
                    {getDecodedQuery(savedSearch.serialized_search)}
                  </td> */}
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
