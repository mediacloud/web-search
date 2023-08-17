import React, { useState } from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import { useListSavedSearchesQuery, useDeleteSavedSearchMutation } from '../../../../app/services/savedsearchApi';
import decodeSavedSearch from '../../util/decodeSavedSearch';

const utc = require('dayjs/plugin/utc');

export default function LoadSavedSearches() {
  dayjs.extend(utc);
  const { data } = useListSavedSearchesQuery();
  const [deleteSavedSearch] = useDeleteSavedSearchMutation();
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

  const getNumQueries = (startDates) => {
    const numQueries = startDates.split(',').length;
    if (numQueries === 1) return 'one query';
    return `${String(numQueries)} queries`;
  };

  const getDecodedQuery = (url) => {
    const queryObj = decodeSavedSearch(url);
    const { startDates, names } = queryObj;
    const numQueries = getNumQueries(startDates);
    return { numQueries, names };
  };

  return (
    <>
      <Button variant="outlined" color="primary" onClick={handleButtonClick}>
        Load Saved Search...
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Saved Searches</DialogTitle>
        <DialogContent>
          <table>
            <thead>
              <tr>
                <th>Saved Name</th>
                <th>Query Date</th>
                <th># Queries</th>
                <th>Query Names</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((savedSearch) => (
                <tr key={savedSearch.id}>
                  <td>
                    <Button
                      style={{ backgroundColor: 'transparent' }}
                      onClick={() => handleSerializedSearchClick(savedSearch.serialized_search)}
                    >
                      {savedSearch.name}
                    </Button>
                  </td>
                  <td>
                    {dayjs.utc(savedSearch.created_at).local().format('MM/DD/YYYY')}
                  </td>
                  <td>
                    {getDecodedQuery(savedSearch.serialized_search).numQueries}
                  </td>
                  <td>
                    {getDecodedQuery(savedSearch.serialized_search).names}
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
