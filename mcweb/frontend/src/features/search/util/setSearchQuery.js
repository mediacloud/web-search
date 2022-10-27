import { useDispatch } from "react-redux";
import { setQueryList, 
         setNegatedQueryList, 
         setStartDate,
         setEndDate,
         setPlatform,
         setAnyAll,
         addSelectedMedia,
         addPreviewSelectedMedia 
        } from "../query/querySlice";
import dayjs from "dayjs";

const setSearchQuery = (searchParams) => {
    const dispatch = useDispatch();
    let query = searchParams.get("query");
    let negatedQuery = searchParams.get('negatedQuery');
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");
    const platform = searchParams.get("platform");
    const collections = searchParams.get("collections");
    const anyAll = searchParams.get("anyAll");

    query = query ? query.split(",") : null;
    console.log(query);
    negatedQuery = negatedQuery ? negatedQuery.split(",") : null;
    console.log(negatedQuery);
    startDate = startDate ? dayjs(startDate).format('MM/DD/YYYY') : null;
    endDate = endDate ? dayjs(endDate).format('MM/DD/YYYY') : null;

    
    if (startDate) {
        dispatch(setStartDate(startDate));
    }
    if (endDate) {
        dispatch(setEndDate(endDate));
    }

    return null;
};



export default setSearchQuery;