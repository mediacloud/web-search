import * as React from 'react';
import {useState} from 'react';
import QueryList from './QueryList';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { setQueryList, setNegatedQueryList, setAnyAll} from './querySlice';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import {useSelector} from 'react-redux';
import { useDispatch } from 'react-redux';
import QueryPreview from './QueryPreview';

export default function SimpleSearch () {

    const [any, setAny] = useState("any");
    const dispatch = useDispatch();

    const handleChangeAnyAll = (event) => {
        setAny(event.target.value);
        dispatch(setAnyAll(event.target.value));
    };

    const {platform} = useSelector(state => state.query);

    const PLATFORM_ONLINE_NEWS = 'onlinenews';
    const PLATFORM_REDDIT = 'reddit';
    const PLATFORM_TWITTER = 'twitter';
    const PLATFORM_YOUTUBE = 'youtube';
    // determines what to give List.js as a parameter from state
    const queryLogic = () => {
        if (any == "any") {
            if (platform === PLATFORM_ONLINE_NEWS || platform === PLATFORM_TWITTER){
                return "OR";
            }else if (platform === PLATFORM_REDDIT || platform === PLATFORM_YOUTUBE){
                return "|";
            }
            
        } else {
            if (platform === PLATFORM_ONLINE_NEWS) {
                return "AND";
            } else if (platform === PLATFORM_TWITTER || platform === PLATFORM_YOUTUBE) {
                return " ";
            } else if (platform === PLATFORM_REDDIT){
                return "+";
            }
        }
    };

    const negatedQueryLogic = () => {
        if (platform === PLATFORM_ONLINE_NEWS) {
            return "OR";
        } else {
            return "-";
        }
    };


    const queryListProps = {
        logic: queryLogic(),
        action: { setQueryList },
    };

    const negatedListProps = {

        logic: negatedQueryLogic(),
        action: { setNegatedQueryList }
    };

    return(
    <div className='simple-search-container'>
        <div className='query-term-container'>
            <div className='simple-search-title'>
                <LooksTwoIcon />
                <h1>Enter Your Search Terms</h1>
            </div>

          <div className='select-any-all'>
            <Select
                value={any}
                onChange={handleChangeAnyAll}
            >
                <MenuItem value={"any"}>Any</MenuItem>
                <MenuItem value={"all"}>All</MenuItem>
            </Select>
            <h1 className='select-title'>of these Phrases</h1>
          </div>
       
            <QueryList negated={false}/>

        </div>

        <div className='negated-query-list'>
            <h1 className='negations-title'>And none of these phrases</h1>

            {/* Negation List */}
            <QueryList negated={true} />
        </div>

    </div>
    );
}