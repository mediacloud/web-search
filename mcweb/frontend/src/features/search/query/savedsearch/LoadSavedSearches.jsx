import * as React from 'react';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useListSavedSearchesQuery } from '../../../../app/services/savedsearchApi';

export default function LoadSavedSearches() {
  const { data } = useListSavedSearchesQuery();
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

  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleButtonClick}>Load Saved Searches</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Search Link</th>
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
                    <Button onClick={() => handleSerializedSearchClick(savedSearch.serialized_search)}>
                      {savedSearch.serialized_search}
                    </Button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
