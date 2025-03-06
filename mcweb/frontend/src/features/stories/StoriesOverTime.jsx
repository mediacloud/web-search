import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetCountOverTimeMutation } from '../../app/services/searchApi';
import CountOverTimeChart from '../search/results/CountOverTimeChart';
import { prepareCountOverTimeData } from '../search/util/prepareCountOverTimeData';
import prepareQueries from '../search/util/prepareQueries';
import { PROVIDER_NEWS_MEDIA_CLOUD, latestAllowedEndDate, earliestAllowedStartDate } from '../search/util/platforms';

export default function StoriesOverTime({ collectionId, sourceId }) {
  const [dispatchQuery, { isLoading, data, error }] = useGetCountOverTimeMutation();
  const query = [{
    queryString: '*',
    queryList: [[], [], []],
    negatedQueryList: [[], [], []],
    platform: PROVIDER_NEWS_MEDIA_CLOUD,
    startDate: dayjs(earliestAllowedStartDate(PROVIDER_NEWS_MEDIA_CLOUD)).format('MM/DD/YYYY'),
    endDate: dayjs(latestAllowedEndDate(PROVIDER_NEWS_MEDIA_CLOUD)).format('MM/DD/YYYY'),
    collections: collectionId ? [collectionId] : [],
    previewCollections: [],
    sources: sourceId ? [sourceId] : [],
    previewSources: [],
    lastSearchTime: dayjs().unix(),
    isFromDateValid: true,
    isToDateValid: true,
    anyAll: 'any',
    advanced: true,
    name: 'All Stories',
    edited: true,

  }];

  useEffect(() => {
    const preparedQueries = prepareQueries(query);
    dispatchQuery(preparedQueries);
  }, []);

  if (isLoading) {
    return (<div><CircularProgress size="75px" /></div>);
  }

  if (!data && !error) return null;

  const preparedData = prepareCountOverTimeData(data, false, query, query);
  const updatedPrepareCountOverTimeData = preparedData.map(
    (originalDataObj) => {
      const queryTitleForPreparation = { name: 'All Stories' };
      return { ...queryTitleForPreparation, ...originalDataObj };
    },
  );
  return (
    <div>
      <CountOverTimeChart series={updatedPrepareCountOverTimeData} normalized={false} />
    </div>
  );
}

StoriesOverTime.propTypes = {
  collectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  sourceId: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
};

StoriesOverTime.defaultProps = {
  collectionId: false,
  sourceId: false,
};
