import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TabPanelHelper from '../ui/TabPanelHelper';
import SourceList from '../sources/SourceList';
import StoriesOverTime from '../stories/StoriesOverTime';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const {
    data: collection,
    isLoading,
  } = useGetCollectionQuery(collectionId);

  if (isLoading) {
    return (<CircularProgress size={75} />);
  }
  return (

    <div className="container">
      <p>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <b>Notes:</b> {collection.notes}
      </p>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">

            <Tab
              label="Source List"
            // eslint-disable-next-line react/jsx-props-no-spreading
              {...a11yProps(0)}
            />
            <Tab
              label="Coverage Over Time"
            // eslint-disable-next-line react/jsx-props-no-spreading
              {...a11yProps(1)}
            />

          </Tabs>
        </Box>
        <TabPanelHelper value={value} index={0}>
          <SourceList collectionId={collectionId} />
        </TabPanelHelper>
        <TabPanelHelper value={value} index={1}>
          <StoriesOverTime collectionId={collectionId} sourceId={false} />
        </TabPanelHelper>
      </Box>
    </div>

  );
}
