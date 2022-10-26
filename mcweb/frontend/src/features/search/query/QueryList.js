import * as React from 'react';
import { useState } from 'react';

// information from store
import { useSelector } from 'react-redux';

import { setQueryList, setNegatedQueryList } from './querySlice';

import { useDispatch } from 'react-redux';

export default function QueryList(props) {
    const dispatch = useDispatch();

    const [serviceList, setServiceList] = useState([[],[],[]]);
    
    const {negated} = props;
   
    const {anyAll} = useSelector(state => state.query);

    // add query 
    const handleServiceAdd = () => {
        setServiceList([...serviceList, []]);
    };

    // remove query
    const handleServiceRemove = (index) => {
        const list = [...serviceList];
        // console.log("IN HANDLE SERVICE REMOVE", list, serviceList);
        list.splice(index, 1);
        setServiceList(list);
    };

    // handle changes to query
    const handleQueryChange = (e, index) => {

        const { value } = e.target;
        const list = [...serviceList];
        list[index] = value;
        setServiceList(list);
        if (negated){
            dispatch(setNegatedQueryList(list));
        } else {
            dispatch(setQueryList(list));
        }
        
    };

    if (negated) {
        return (
            <div>
                {serviceList.map((singleService, index) => (
                    <div key={index} className='services'>

                        <div className="first-division">
                            <input name="service" type="text" id="service" required
                                value={String(singleService)}
                                onChange={(e) => handleQueryChange(e, index)} />

                            
                            {!(serviceList.length - 1 === index) && (
                                <span>AND NOT</span>
                            )}

                            {serviceList.length - 1 === index && (
                                <button
                                    onClick={handleServiceAdd}
                                    type="button"
                                    className='add-btn'>
                                    <span>Add Query Term</span>
                                </button>
                            )}
                        </div>

                        <div>
                            {anyAll === "any" && (
                                <h4></h4>
                            )}
                        </div>


                    </div>
                ))}
            </div>

        );
    }

    else {
        if (anyAll === 'any'){
            return (
                <div>
                    {serviceList.map((singleService, index) => (
                        <div key={index} className='services'>

                            <div className="first-division">
                                <input name="service" type="text" id="service" required
                                    value={String(singleService)}
                                    onChange={(e) => handleQueryChange(e, index)} />


                                {!(serviceList.length - 1 === index) && (
                                    <span>OR</span>
                                )}

                                {serviceList.length - 1 === index && (
                                    <button
                                        onClick={handleServiceAdd}
                                        type="button"
                                        className='add-btn'>
                                        <span>Add Query Term</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            );
        } else if (anyAll === 'all') {
            return (
                <div>
                    {serviceList.map((singleService, index) => (
                        <div key={index} className='services'>

                            <div className="first-division">
                                <input name="service" type="text" id="service" required
                                    value={String(singleService)}
                                    onChange={(e) => handleQueryChange(e, index)} />


                                {!(serviceList.length - 1 === index) && (
                                    <span>AND</span>
                                )}

                                {serviceList.length - 1 === index && (
                                    <button
                                        onClick={handleServiceAdd}
                                        type="button"
                                        className='add-btn'>
                                        <span>Add Query Term</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            );
        }
    }
}