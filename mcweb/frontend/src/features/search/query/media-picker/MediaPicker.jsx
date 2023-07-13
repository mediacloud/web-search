import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { addSelectedMedia, removePreviewSelectedMedia } from '../querySlice';
import CollectionSearchPicker from './CollectionSearchPicker';
import SelectedMedia from '../SelectedMedia';
import FeaturedCollectionsPicker from './FeaturedCollectionsPicker';
import GeographicCollectionsPicker from './GeographicCollectionsPicker';
import SourceSearchPicker from './SourceSearchPicker';
import { PROVIDER_NEWS_MEDIA_CLOUD, PROVIDER_NEWS_WAYBACK_MACHINE } from '../../util/platforms';

export default function MediaPicker({ queryIndex }) {
  const [value, setValue] = React.useState(0);
  // const [tab, setTab] = useState('featuredCollections');
  const dispatch = useDispatch();
  const { previewCollections, previewSources, platform } = useSelector((state) => state.query[queryIndex]);
  const [open, setOpen] = useState(false);
  const addType = (pS, pC) => {
    const sourceTypes = pS.map((s) => ({
      id: s,
      type: 'source',
    }));
    const collectionTypes = pC.map((c) => ({
      id: c,
      type: 'collection',
    }));
    return [...sourceTypes, ...collectionTypes];
  };

  return (
    <div className="media-picker">
      <Button variant="outlined" onClick={() => setOpen(true)} endIcon={<MoreVertIcon />}>
        Select Collections
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
              <Tab label="Featured Collections" id="tab1" />
              <Tab label="Search All Collections" id="tab1" />
              <Tab label="Search All Sources" id="tab1" />
              {[PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD].includes(platform) && (
                <Tab label="Geographic Collections" id="tab1" />
              )}

              <div className="media-picker-controls">
                <h3>Selected Collections</h3>
                <SelectedMedia
                  onRemove={removePreviewSelectedMedia}
                  collections={previewCollections}
                  sources={previewSources}
                  queryIndex={queryIndex}
                  preview
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    setOpen(false);
                    dispatch(addSelectedMedia({ sourceOrCollection: addType(previewSources, previewCollections), queryIndex }));
                  }}
                >
                  Confirm
                </Button>
                <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
              </div>

            </Tabs>

            <div className="tabpanel" role="tabpanel" hidden={value !== 0} id="tabpanel-0">
              {value === 0 && (
                <>
                  <h2>Featured Collections</h2>
                  <FeaturedCollectionsPicker queryIndex={queryIndex} platform={platform.split('-')[0]} />
                </>
              )}
            </div>
            <div className="tabpanel" role="tabpanel" hidden={value !== 1} id="tabpanel-2">
              {value === 1 && (
                <>
                  <h2>Search All Collections</h2>
                  <CollectionSearchPicker queryIndex={queryIndex} platform={platform.split('-')[0]} />
                </>
              )}
            </div>
            <div className="tabpanel" role="tabpanel" hidden={value !== 2} id="tabpanel-3">
              {value === 2 && (
                <>
                  <h2>Search All Sources</h2>
                  <SourceSearchPicker queryIndex={queryIndex} platform={platform.split('-')[0]} />
                </>
              )}
            </div>
            {[PROVIDER_NEWS_WAYBACK_MACHINE, PROVIDER_NEWS_MEDIA_CLOUD].includes(platform) && (

            <div className="tabpanel" role="tabpanel" hidden={value !== 3} id="tabpanel-1">
              {value === 3 && (
              <>
                <h2>Geographic Collections</h2>
                <GeographicCollectionsPicker queryIndex={queryIndex} platform={platform.split('-')[0]} />
              </>
              )}
            </div>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}

MediaPicker.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
