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

const formatQuery = (query) => {
  if (query === null) return null;
  const finalQuery = new Array(query.length);
  for (let i = 0; i < query.length; i += 1) {
    finalQuery[i] = [query[i]];
  }
  return finalQuery;
};

const formatCollections = (collections) => {
    console.log(collections);
  return collections.map(collection => {
    const [id, name] = collection.split('>');
    return {'id': id, 'name':name};
  });
};


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
    query = formatQuery(query);

    negatedQuery = negatedQuery ? negatedQuery.split(",") : null;
    negatedQuery = formatQuery(negatedQuery);

    startDate = startDate ? dayjs(startDate).format('MM/DD/YYYY') : null;
    endDate = endDate ? dayjs(endDate).format('MM/DD/YYYY') : null;

    collections = collections ? collections.split(",") : null;
    collections = formatCollections(collections);
    console.log(collections);
    // collections = getCollections(collections);
   
    if (query) {
        dispatch(setQueryList(query));
    }
    if (negatedQuery) {
        dispatch(setNegatedQueryList(negatedQuery));
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