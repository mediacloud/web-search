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
    let collections = searchParams.get("collections");
    const anyAll = searchParams.get("anyAll");

    query = query ? query.split(",") : null;
    console.log(query);
    negatedQuery = negatedQuery ? negatedQuery.split(",") : null;
    console.log(negatedQuery);
    startDate = startDate ? dayjs(startDate).format('MM/DD/YYYY') : null;
    endDate = endDate ? dayjs(endDate).format('MM/DD/YYYY') : null;
    collections = collections ? collections.split(",") : null;

    if (query) {
        dispatch(setQueryList([query]));
    }
    if (negatedQuery) {
        dispatch(setNegatedQueryList([negatedQuery]));
    }
    if (startDate) {
        dispatch(setStartDate(startDate));
    }
    if (endDate) {
        dispatch(setEndDate(endDate));
    }
    if (platform) {
        dispatch(setPlatform(platform));
    }
    if (anyAll) {
        dispatch(setAnyAll(anyAll));
    }
    if (collections) {
        dispatch(addSelectedMedia(collections));
    }

    return null;
};



export default setSearchQuery;