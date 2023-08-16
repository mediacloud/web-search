import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { addSavedSearch } from '../querySlice';
import { useListSavedSearchesQuery, useDeleteSavedSearchMutation } from '../../../../app/services/savedsearchApi';
import decodeSavedSearch from '../../util/decodeSavedSearch';
import { setSearchQuery } from '../../util/setSearchQuery';

const utc = require('dayjs/plugin/utc');

export default function LoadSavedSearches() {
  dayjs.extend(utc);
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
                <th>Query Date</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((savedSearch) => (
                <tr key={savedSearch.id}>
                  {console.log(savedSearch)}
                  <td>
                    <a href={savedSearch.serialized_search}>
                      {savedSearch.name}
                    </a>
                  </td>
                  <td>
                    {dayjs.utc(savedSearch.created_at).local().format('MM/DD/YYYY')}
                  </td>
                  {/* <td>
                    {getDecodedQuery(savedSearch.serialized_search)}
                  </td> */}
                  {/* <td>
                    <IconButton
                      size="small"
                      aria-label="load"
                      onClick={() => handleLoadSavedSearch(savedSearch.serialized_search)}
                    >
                      <AddCircleIcon sx={{ color: '#d24527' }} />
                    </IconButton>
                  </td> */}
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
