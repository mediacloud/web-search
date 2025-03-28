import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TabPanelHelper from '../ui/TabPanelHelper';
import SourceList from '../sources/SourceList';
import StoriesOverTime from '../stories/StoriesOverTime';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import renderNotes from './util/formatNotesToHTML';

function a11yProps(index) {
  return {
    id: `collection-tab-${index}`,
    'aria-controls': `collection-tabpanel-${index}`,
  };
}
const utc = require('dayjs/plugin/utc');

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);
  dayjs.extend(utc);
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

  document.title = `${collection.name} | Media Cloud`;

  return (

    <div className="container">
      <div>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <b>Notes:</b> {collection.notes && renderNotes(collection.notes, false)}
        <p>
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          <b>Last Modified:</b> {dayjs.utc(collection.modified_at).local().format('MM/DD/YYYY HH:mm:ss')}
        </p>
      </div>
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
          <div className="container">
            <div className="row">
              <div className="col-12">
                <SourceList collectionId={collectionId} />
              </div>
            </div>
          </div>
        </TabPanelHelper>
        <TabPanelHelper value={value} index={1}>
          <StoriesOverTime collectionId={collectionId} sourceId={false} />
        </TabPanelHelper>
      </Box>
    </div>

  );
}
