import * as React from 'react';
import { useSelector } from 'react-redux';
import {queryGenerator} from '../util/queryGenerator';
import { useEffect } from 'react';

export default function QueryPreview() {
    const {
        queryList,
        negatedQueryList,
        platform,
        anyAll
    } = useSelector(state => state.query);

    let query = queryGenerator(queryList, negatedQueryList, platform, anyAll);

    useEffect(()=> {
        query = queryGenerator(queryList, negatedQueryList, platform, anyAll);
    }, [queryList, negatedQueryList]);

    return(
        <div>
            <h3>Your Query Preview</h3>
            <div>{query}</div>
        </div>
    );
}