import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import { setStartDate, setEndDate } from './querySlice';
import dayjs from 'dayjs';
import Looks4Icon from '@mui/icons-material/Looks4';

export default function SearchDatePicker() {

    const dispatch = useDispatch();
    const {startDate, endDate} = useSelector(state => state.query);
    // const [fromValue, setFromValue] = React.useState(dayjs().subtract(30, 'day'));

    // const [toValue, setToValue] = React.useState(dayjs());


    const handleChangeFromDate = (newValue) => {
        // setFromValue(dayjs(newValue));
        dispatch(setStartDate(dayjs(newValue).format('MM/DD/YYYY')));
    };

    const handleChangeToDate = (newValue) => {
        dispatch(setEndDate(dayjs(newValue).format('MM/DD/YYYY')));
    };

    // const disabledDates = (date) => {
    //     if (date === dayjs().subtract(2, 'day').format('MM/DD/YYYY')){
    //         return true;
    //     } else if (dayjs().subtract(1, 'day').format('MM/DD/YYYY')) {
    //         return true;
    //     } else if (dayjs().format('MM/DD/YYYY')) {
    //         return true;
    //     }
    // };

    return (
            <div className="date-picker-container">
                <div className='date-picker-title'>
                    <Looks4Icon />
                    <h3>Enter Dates</h3>
                </div>
                <LocalizationProvider dateAdapter={AdapterDateFns}>

                    <Stack
                        spacing={2}
                        method="post"
                        sx={{ backgroundColor: "white", padding: "25px" }}
                    >

                        {/* From Date */}
                        <DatePicker
                            required
                            type='date'
                            label="From"
                            value={startDate}
                            onChange={handleChangeFromDate}
                            disableFuture={true}
                            disableHighlightToday={true}
                            maxDate={dayjs(dayjs().subtract(3, 'day').format('MM/DD/YYYY'))}
                            
                            renderInput={(params) => <TextField {...params} />}
                        />

                        {/* To Date */}
                        <DatePicker
                            required
                            label="To"
                            value={endDate}
                            onChange={handleChangeToDate}
                            disableFuture={true}
                            disableHighlightToday={true}
                            maxDate={dayjs(dayjs().subtract(3, 'day').format('MM/DD/YYYY'))}
                            // shouldDisableDate={disabledDates}
                            renderInput={(params) => <TextField {...params} />}
                        />

                    </Stack>
                </LocalizationProvider>
            <p className='date-info'>Enter your inclusive date range. 
                Our database goes back to 2011, 
                however the start date for different 
                sources and collections can vary. 
                Click on a source or collecton to 
                learn more about when we added it.</p>
            </div>
    );
}