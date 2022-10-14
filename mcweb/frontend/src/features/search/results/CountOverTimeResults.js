import * as React from 'react';
import { useSelector } from 'react-redux';
import CountOverTimeChart from './CountOverTimeChart';

export default function CountOverTimeResults(){

    const {countOverTime} = useSelector(state => state.results);
    
    if (!countOverTime) return null;

    return (
        <div>
            <h3>Count Over Time</h3>
            <CountOverTimeChart />
        </div>
    );
}