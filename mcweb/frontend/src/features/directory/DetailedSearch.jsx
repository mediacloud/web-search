import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import CollectionSearch from './CollectionSearch';
import SourceSearch from './SourceSearch';
import GeographicCollectionsSearch from './GeographicCollectionsSearch';

export default function DetailedSearch() {
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Detailed Search
      </Button>

      {/* https://stackoverflow.com/questions/47698037/how-can-i-set-a-height-to-a-dialog-in-material-ui */}
      <Dialog
        maxWidth="xl"
        fullWidth
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            minHeight: '90vh',
          },
        }}
      >
        <DialogContent>
          <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex' }}>
            <Tabs
              orientation="vertical"
              value={value}
              onChange={(event, newValue) => { setValue(newValue); }}
              sx={{ minWidth: '350px' }}
            >
              <Tab label="Search All Collections" id="tab1" />
              <Tab label="Search All Sources" id="tab1" />
              <Tab label="Geographic Collections" id="tab1" />

            </Tabs>
            <div className="tabpanel" role="tabpanel" hidden={value !== 0} id="tabpanel-1">
              {value === 0 && (
                <>
                  <h2>Search All Collections</h2>
                  <CollectionSearch />
                </>
              )}
            </div>
            <div className="tabpanel" role="tabpanel" hidden={value !== 1} id="tabpanel-2">
              {value === 1 && (
                <>
                  <h2>Search All Sources</h2>
                  <SourceSearch />
                </>
              )}
            </div>
            <div className="tabpanel" role="tabpanel" hidden={value !== 2} id="tabpanel-3">
              {value === 2 && (
                <>
                  <h2>Geographic Collections</h2>
                  <GeographicCollectionsSearch />
                </>
              )}
            </div>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
