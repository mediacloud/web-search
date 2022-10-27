import * as React from 'react';
import {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FeaturedCollectionsPicker from './FeaturedCollectionsPicker';
import SelectedMediaPreview from '../SelectedMediaPreview';
import CollectionSearchPicker from './CollectionSearchPicker';
import { addSelectedMedia, removePreviewSelectedMedia } from '../querySlice';
import { closeModal } from '../../../ui/uiSlice';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';


export default function MediaPicker(props) {
    // const {isOpen} = props;
    // console.log(isOpen);
    const [value, setValue] = React.useState(0);
    const [tab, setTab] = useState('featuredCollections');
    const dispatch = useDispatch();
    const {previewCollections} = useSelector(state => state.query);
    const [open, setOpen] = useState(false);

    return (
        <div className="media-picker">
          <Button variant="outlined" onClick={()=> setOpen(true)}>
            Select Collections
          </Button>

          {/* https://stackoverflow.com/questions/47698037/how-can-i-set-a-height-to-a-dialog-in-material-ui */}
          <Dialog maxWidth={'xl'} fullWidth={true} open={open} onClose={() => setOpen(false)}
              PaperProps={{
                sx: {
                  minHeight: '90vh'
                }
              }}>
            <DialogContent>
              <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex' }}>
                <Tabs
                  orientation="vertical"
                  value={value}
                  onChange={(event, newValue) => { setValue(newValue) }}
                  sx={{ width: '300px' }}
                >
                  <Tab label="Featured Collections" id="tab1" />
                  <Tab label="Search All Collections" id="tab1" />
                  <Tab label="Search All Sources" id="tab1" />

                  <div className="media-picker-controls">
                    <h3>Selected Collections</h3>
                    <SelectedMediaPreview onRemove={removePreviewSelectedMedia} />
                    <Button variant="contained" onClick={() => {
                        setOpen(false);
                        dispatch(addSelectedMedia(previewCollections));
                    }}>
                      Confirm
                    </Button>
                    <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
                  </div>

                </Tabs>

                <div role="tabpanel" hidden={value !== 0} index={0} id="tabpanel-0">
                  {value === 0 && (
                    <Box sx={{ p: 3}}>
                      <h2>Featured Collections</h2>
                      <FeaturedCollectionsPicker />
                    </Box>
                  )}
                </div>
                <div role="tabpanel" hidden={value !== 1} index={1} id="tabpanel-1">
                  {value === 1 && (
                    <Box sx={{ p: 3 }}>
                      <h2>Search All Collections</h2>
                      <CollectionSearchPicker />
                    </Box>
                  )}
                </div>
                <div role="tabpanel" hidden={value !== 2} index={2} id="tabpanel-2">
                  {value === 2 && (
                    <Box sx={{ p: 3 }}>
                      <h2>Search All Sources</h2>
                      <p>🚧 Coming soon</p>
                    </Box>
                  )}
                </div>
              </Box>
            </DialogContent>
          </Dialog>
        </div>
    );
}
