import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import CircularProgress from '@mui/material/CircularProgress';
import TabPanelHelper from '../ui/TabPanelHelper';
import StoriesOverTime from '../stories/StoriesOverTime';
import buildStatArray from './util/buildStatArray';
import CollectionList from '../collections/CollectionList';
import { useGetSourceQuery } from '../../app/services/sourceApi';
import StatPanel from '../ui/StatPanel';
import FeedStories from '../feeds/FeedStories';
import { renderNotes } from '../collections/util/formatNotesToHTML';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const utc = require('dayjs/plugin/utc');

export default function SourceShow() {
  const params = useParams();
  const sourceId = Number(params.sourceId);
  dayjs.extend(utc);
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const {
    data: source,
    isLoading,
  } = useGetSourceQuery(sourceId);

  useEffect(() => {
    document.title = `${source.name} | Media Cloud`;
  });

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  return (
    <div className="container">
      {(source.platform === 'online_news') && (
        <StatPanel items={buildStatArray(source)} />
      )}

      <div className="row">
        <div className="col-6">
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Homepage</b>: <a href={source.homepage} target="_blank" rel="noreferrer">{source.homepage}</a>
          </p>
          {source.url_search_string && (
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>URL Search String</b>: {source.url_search_string}
          </p>
          )}
          {source.notes && (
            <p>
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              <b>Notes:</b> {source.notes && renderNotes(source.notes)}
            </p>
          )}

          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Last Rescraped:</b> {source.last_rescraped
              ? dayjs.utc(source.last_rescraped).local().format('MM/DD/YYYY HH:mm:ss')
              : 'Source has not been rescraped recently' }
          </p>
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Last Rescraped Details:</b> {source.last_rescraped_msg
              ? source.last_rescraped_msg
              : 'Source has not been rescraped recently' }
          </p>

        </div>
      </div>

      <div className="container">
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">

              <Tab
                label="Collection List"
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
            <div className="row">
              <div className="col-6">
                <CollectionList sourceId={sourceId} />
              </div>
              {source.platform === 'online_news' && (
              <div className="col-6">
                <FeedStories feed={false} sourceId={sourceId} />
              </div>
              )}
            </div>
          </TabPanelHelper>
          <TabPanelHelper value={value} index={1}>
            <StoriesOverTime sourceId={sourceId} collectionId={false} />
          </TabPanelHelper>
        </Box>
      </div>

      {/* <div className="row">
        <div className="col-6">
          <CollectionList sourceId={sourceId} />
        </div>
        {source.platform === 'online_news' && (
          <div className="col-6">
            <FeedStories feed={false} sourceId={sourceId} />
          </div>
        )}
      </div> */}

    </div>
  );
}
