import * as React from 'react';
import { useState } from 'react';
import { setQueryList, setNegatedQueryList } from './querySlice';
import { useDispatch, useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';

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
                                <span className='and-or'>AND NOT</span>
                            )}

                            {serviceList.length - 1 === index && (
                                <div onClick={handleServiceAdd} >
                                    <AddCircleIcon sx={{color:'green', marginLeft:'.5rem'}} />
                                </div>
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
                                    <span className='and-or'>OR</span>
                                )}

                                {serviceList.length - 1 === index && (
                                    <div onClick={handleServiceAdd} >
                                        <AddCircleIcon sx={{ color: 'green', marginLeft: '.5rem' }} />
                                    </div>
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
                                    <span className='and-or'>AND</span>
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