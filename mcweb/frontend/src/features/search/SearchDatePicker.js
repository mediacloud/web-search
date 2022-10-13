import * as React from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import { setStartDate, setEndDate } from './querySlice';
import dayjs from 'dayjs';


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

    return (
        <>
            <div className="searchContainer">
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
                            inputFormat="MM/dd/yyyy"
                            value={startDate}
                            onChange={handleChangeFromDate}
                            renderInput={(params) => <TextField {...params} />}
                        />

                        {/* To Date */}
                        <DatePicker
                            required
                            label="To"
                            inputFormat="MM/dd/yyyy"
                            value={endDate}
                            onChange={handleChangeToDate}
                            renderInput={(params) => <TextField {...params} />}
                        />

                    </Stack>
                </LocalizationProvider>
            </div>
        </>
    );
}