import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import QueryList from './QueryList';
import { setQueryProperty, copyToAllQueries, QUERY } from './querySlice';
import CopyToAll from '../util/CopyToAll';
import QueryPreview from './QueryPreview';
import SearchAlertDialog from '../../ui/AlertDialog';

export default function SimpleSearch({ queryIndex }) {
  const { anyAll } = useSelector((state) => state.query[queryIndex]);

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [openQuery, setOpenQuery] = useState(false);

  const handleChangeAnyAll = (event) => {
    dispatch(setQueryProperty({ anyAll: event.target.value, queryIndex, property: 'anyAll' }));
  };

  return (
    <div className="container">

      <div className="row">

        <div className="col-4">
          <div className="query-section">
            <div className="copy-toall">
              <h3>
                <em>1</em>
                Enter search phrases
              </h3>
              <CopyToAll
                openDialog={openQuery}
                title="Copy To All Queries"
                content="Are you sure you want to copy these keywords
                to all your queries? This will replace the keywords for all of your queries."
                action={copyToAllQueries}
                actionTarget={{ property: QUERY, queryIndex }}
                snackbar
                snackbarText="Media Copied To All Queries"
                dispatchNeeded
                onClick={() => setOpenQuery(true)}
                className="float-end"
                confirmButtonText="OK"
              />
            </div>
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
            <QueryList queryIndex={queryIndex} negated={false} />
          </div>
        </div>

        <div className="col-4">
          <div className="query-section">
            <h3>&nbsp;</h3>
            <div className="description">
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              And <b> none</b> of these phrases:
            </div>
            <QueryList queryIndex={queryIndex} negated />
          </div>
        </div>

        <div className="col-4">
          <div className="query-section">
            <h3>&nbsp;</h3>
            <div className="description">Your query preview:</div>
            <QueryPreview queryIndex={queryIndex} />
          </div>
          <div className=".search-button-wrapper">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <SearchAlertDialog
                    outsideTitle="Edit this query in advanced mode"
                    title="Switch to Advanced Search"
                    content="Are you sure you would like to switch to advanced search?
                      After confirming you will not be able to switch back to simple search."
                    className="float-start"
                    dispatchNeeded
                    action={() => setQueryProperty({ advanced: true, queryIndex, property: 'advanced' })}
                    actionTarget
                    onClick={() => setOpen(true)}
                    variant="outlined"
                    openDialog={open}
                    confirmButtonText="confirm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

SimpleSearch.propTypes = {
  queryIndex: PropTypes.number.isRequired,
};
