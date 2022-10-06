import * as React from 'react';
import { useSelector } from 'react-redux';

export default function CountOverTimeResults(){

    const {countOverTime} = useSelector(state => state.results);
    
    if (!countOverTime) return null;

    return (
        <div>
            <h3>Count Over Time</h3>
            {countOverTime["counts"].map((data, index) => {
                return (<h5 key={index}>count: {data.count} date: {data.date}</h5>);
            })}
        </div>
    );
}