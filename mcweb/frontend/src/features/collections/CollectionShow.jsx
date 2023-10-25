import * as React from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import SourceList from '../sources/SourceList';
import { useGetCollectionQuery } from '../../app/services/collectionsApi';
import { useGetCountOverTimeMutation } from '../../app/services/searchApi';
import CountOverTimeChart from '../search/results/CountOverTimeChart';

export default function CollectionShow() {
  const params = useParams();
  const collectionId = Number(params.collectionId);
  // const [dispatchQuery, { isLoading: countLoading, data, error }] = useGetCountOverTimeMutation();
  // const preparedData = prepareCountOverTimeData(data, normalized, queryState);
  // if (preparedData.length !== queryState.length) return null;
  // const updatedPrepareCountOverTimeData = preparedData.map(
  //   (originalDataObj, index) => {
  //     const queryTitleForPreparation = { name: queryState[index].name };
  //     return { ...queryTitleForPreparation, ...originalDataObj };
  //   },
  // );
  const {
    data: collection,
    isLoading,
  } = useGetCollectionQuery(collectionId);

  if (isLoading) {
    return (<CircularProgress size={75} />);
  }
  return (
    <div className="container">
      <div className="row">
        <div className="col-6">
          <p>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <b>Notes:</b> {collection.notes}
          </p>
          <SourceList collectionId={collectionId} />
          <CountOverTimeChart
            series={updatedPrepareCountOverTimeData}
            normalized={false}
          />
        </div>
      </div>
    </div>
  );
}
