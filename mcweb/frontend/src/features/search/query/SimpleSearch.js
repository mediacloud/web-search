import * as React from 'react';
import {useState} from 'react';
import QueryList from './QueryList';
import SelectUnstyled from '@mui/base/SelectUnstyled';
import OptionUnstyled from '@mui/base/OptionUnstyled';
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
      <div className="row">

        <div className="col-4">
          <div className='query-section'>
            <h3><em>2</em>Enter simple search terms</h3>
            {/*  can't use <p> tag here, because UL of options can't be child of it :-( */}
            <div className="description">
            Match
              <select
                className="select-inline"
                value={any}
                onChange={handleChangeAnyAll}
              >
                <option value={"any"}>Any</option>
                <option value={"all"}>All</option>
              </select>
              of these phrases:
            </div>
            <QueryList negated={false}/>
          </div>
        </div>

        <div className="col-4">
          <h3>&nbsp;</h3>
          <div className="description">And <b>none</b> of these phrases:</div>
          <QueryList negated={true} />
        </div>

        <div className="col-4">
          <h3>&nbsp;</h3>
          <div className="description">Your query preview:</div>
          <QueryPreview />
        </div>

      </div>
    );
}
