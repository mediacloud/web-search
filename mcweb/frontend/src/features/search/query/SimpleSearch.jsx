import * as React from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QueryList from './QueryList';
import { setAnyAll } from './querySlice';
import QueryPreview from './QueryPreview';
import SearchAlertDialog from '../util/SearchAlertDialog';

export default function SimpleSearch() {
  const { anyAll } = useSelector((state) => state.query);

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  const handleChangeAnyAll = (event) => {
    dispatch(setAnyAll(event.target.value));
  };

  return (
    <div className="row">

      <div className="col-4">
        <div className="query-section">
          <h3>
            <em>1</em>
            Enter search phrases
          </h3>
          {/*  can't use <p> tag here, because UL of options can't be child of it :-( */}
          <div className="description">
            Match
            <select
              className="select-inline"
              value={anyAll}
              onChange={handleChangeAnyAll}
            >
              <option value="any">Any</option>
              <option value="all">All</option>
            </select>
            of these phrases:
          </div>
          <QueryList negated={false} />
        </div>
      </div>

      <div className="col-4">
        <div className="query-section">
          <h3>&nbsp;</h3>
          <div className="description">
            And
            {' '}
            <b> none</b>
            {' '}
            of these phrases:
          </div>
          <QueryList negated />
        </div>
      </div>

      <div className="col-4">
        <div className="query-section">
          <h3>&nbsp;</h3>
          <div className="description">Your query preview:</div>
          <QueryPreview />
        </div>
      </div>
      <div className="clearfix">
        <div className="float-start">
          <SearchAlertDialog onClick={() => setOpen(true)} openDialog={open} />
        </div>
      </div>
    </div>
  );
}
