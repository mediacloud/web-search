import * as React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { setQueryList, setNegatedQueryList } from './querySlice';

export default function QueryList({ negated }) {
  const dispatch = useDispatch();
  const { anyAll, queryList, negatedQueryList } = useSelector((state) => state.query);
  const [serviceList, setServiceList] = useState(negated ? negatedQueryList : queryList);

  useEffect(() => {
    negated ? setServiceList(negatedQueryList) : setServiceList(queryList);
  }, [queryList, negatedQueryList]);

  const handleServiceAdd = () => {
    const list = [...serviceList];
    list.push([]);

    setServiceList(list);

    if (negated) {
      dispatch(setNegatedQueryList(list));
    } else {
      dispatch(setQueryList(list));
    }
  };

  const handleServiceRemove = () => {
    const list = [...serviceList];
    list.pop();

    setServiceList(list);

    if (negated) {
      dispatch(setNegatedQueryList(list));
    } else {
      dispatch(setQueryList(list));
    }
  };

  const handleQueryChange = (e, index) => {
    const { value } = e.target;
    const list = [...serviceList];
    list[index] = value;
    setServiceList(list);

    if (negated) {
      dispatch(setNegatedQueryList(list));
    } else {
      dispatch(setQueryList(list));
    }
  };

  if (negated) {
    return (
      <div className="query-term-list">
        {serviceList.map((singleService, index) => (
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

              {!(serviceList.length - 1 === index) && (
              <span className="and-or">AND NOT</span>
              )}

              {serviceList.length - 1 === index && (
              <div onClick={handleServiceAdd}>
                <AddCircleOutlineIcon sx={{ color: '#d24527', marginLeft: '.5rem' }} />
              </div>
              )}

              {serviceList.length - 1 === index && serviceList.length - 1 >= 1 && (
              <div onClick={handleServiceRemove} onChange={handleQueryChange}>
                <RemoveCircleOutlineIcon sx={{ color: '#d24527', marginLeft: '.5rem' }} />
              </div>
              )}

            </div>

          </div>
        ))}
      </div>

    );
  }

  if (anyAll === 'any') {
    return (
      <div className="query-term-list">
        {serviceList.map((singleService, index) => (
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

              {!(serviceList.length - 1 === index) && (
              <span className="and-or">OR</span>
              )}

              {serviceList.length - 1 === index && (
              <div onClick={handleServiceAdd}>
                <AddCircleOutlineIcon sx={{ color: '#d24527', marginLeft: '.5rem' }} />
              </div>
              )}

              {serviceList.length - 1 === index && serviceList.length - 1 >= 1 && (
              <div onClick={handleServiceRemove} onChange={handleQueryChange}>
                <RemoveCircleOutlineIcon sx={{ color: '#d24527', marginLeft: '.5rem' }} />
              </div>
              )}
            </div>
          </div>
        ))}
      </div>

    );
  } if (anyAll === 'all') {
    return (
      <div className="query-term-list">
        {serviceList.map((singleService, index) => (
          <div key={index} className="query-term-item">

            <div className="first-division">
              <input
                size="40"
                name="service"
                type="text"
                id="service"
                required
                value={String(singleService)}
                onChange={(e) => handleQueryChange(e, index)}
              />

              {!(serviceList.length - 1 === index) && (
              <span className="and-or">AND</span>
              )}

              {serviceList.length - 1 === index && (
              <div onClick={handleServiceAdd}>
                <AddCircleOutlineIcon sx={{ color: '#d24527', marginLeft: '.5rem' }} />
              </div>
              )}

              {serviceList.length - 1 === index && serviceList.length - 1 >= 1 && (
              <div onClick={handleServiceRemove}>
                <RemoveCircleOutlineIcon sx={{ color: '#d24527', marginLeft: '.5rem' }} />
              </div>
              )}
            </div>
          </div>
        ))}
      </div>

    );
  }
}
