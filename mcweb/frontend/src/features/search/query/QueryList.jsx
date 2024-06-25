import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import IconButton from '@mui/material/IconButton';
import { setQueryProperty } from './querySlice';

export default function QueryList({ negated, queryIndex }) {
  const dispatch = useDispatch();
  const { anyAll, queryList, negatedQueryList } = useSelector((state) => state.query[queryIndex]);
  const [serviceList, setServiceList] = useState(negated ? negatedQueryList : queryList);

  // if negated === true then 'AND NOT' else if anyAll === 'any' then 'OR' else 'AND'
  // eslint-disable-next-line no-nested-ternary
  const [text, setText] = useState(negated ? 'AND NOT' : (anyAll === 'any' ? 'OR' : 'AND'));

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    negated ? setServiceList(negatedQueryList) : setServiceList(queryList);
    // eslint-disable-next-line no-unused-expressions, no-nested-ternary
    negated ? setText('AND NOT') : (anyAll === 'any' ? setText('OR') : setText('AND'));
  }, [anyAll, queryList, negatedQueryList]);

  const handleServiceAdd = () => {
    const list = [...serviceList];
    list.push([]);

    setServiceList(list);

    if (negated) {
      dispatch(setQueryProperty({ negatedQueryList: list, queryIndex, property: 'negatedQueryList' }));
    } else {
      dispatch(setQueryProperty({ queryList: list, queryIndex, property: 'queryList' }));
    }
  };

  const handleServiceRemove = () => {
    const list = [...serviceList];
    list.pop();

    setServiceList(list);

    if (negated) {
      dispatch(setQueryProperty({ negatedQueryList: list, queryIndex, property: 'negatedQueryList' }));
    } else {
      dispatch(setQueryProperty({ queryList: list, queryIndex, property: 'queryList' }));
    }
  };

  const handleQueryChange = (e, index) => {
    const { value } = e.target;
    const list = [...serviceList];
    list[index] = value;
    setServiceList(list);

    if (negated) {
      dispatch(setQueryProperty({ negatedQueryList: list, queryIndex, property: 'negatedQueryList' }));
    } else {
      dispatch(setQueryProperty({ queryList: list, queryIndex, property: 'queryList' }));
    }
  };

  return (
    <div className="query-term-list">
      {serviceList.map((singleService, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className="query-term-item">

          <div className="first-division">

            <input
              size="35"
              name="service"
              type="text"
              id="service"
              required
              value={String(singleService)}
              onChange={(e) => handleQueryChange(e, index)}
            />

            {(serviceList.length - 1 !== index) && (
              <span className="and-or">{text}</span>
            )}

            {serviceList.length - 1 === index && (
              <IconButton
                sx={{
                  '&.MuiButtonBase-root:hover': {
                    bgcolor: 'transparent',
                  },
                  marginLeft: '-.25rem',
                }}
                onClick={handleServiceAdd}
              >
                <AddCircleOutlineIcon sx={{ color: '#d24527' }} />
              </IconButton>
            )}

            {serviceList.length - 1 === index && serviceList.length - 1 >= 1 && (
              <IconButton
                sx={{
                  '&.MuiButtonBase-root:hover': { bgcolor: 'transparent' },
                  marginLeft: '-.5rem',
                }}
                onClick={handleServiceRemove}
                onChange={handleQueryChange}
              >
                <RemoveCircleOutlineIcon sx={{ color: '#d24527' }} />
              </IconButton>
            )}

          </div>

        </div>
      ))}
    </div>

  );
}

QueryList.propTypes = {
  queryIndex: PropTypes.number.isRequired,
  negated: PropTypes.bool.isRequired,
};
