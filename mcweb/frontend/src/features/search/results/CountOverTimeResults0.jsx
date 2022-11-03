import * as React from 'react';
import { useSelector } from 'react-redux';
import CountOverTimeChart from './CountOverTimeChart';
// import { useDownloadCountsOverTimeCSVMutation } from '../../../app/services/searchApi';

export default function CountOverTimeResults() {
  const { countOverTime } = useSelector((state) => state.results);
  // const [downloadCsv, csvResults] = useDownloadCountsOverTimeCSVMutation();

  if (!countOverTime) return null;

  return (
    <div className="results-item-wrapper clearfix">
      <h2>Count Over Time</h2>
      <CountOverTimeChart />
    </div>
  );
}
