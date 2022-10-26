const PLATFORM_ONLINE_NEWS = 'onlinenews';


export const queryGenerator = (queryList, negatedQueryList, platform, anyAll) => {
    const PLATFORM_ONLINE_NEWS = "onlinenews";
    const PLATFORM_REDDIT = 'reddit';
    const PLATFORM_YOUTUBE = 'youtube';
    const PLATFORM_TWITTER = 'twitter';

    let fullQuery = "";
    if (!queryList && !negatedQueryList) return null;
    
    const query = queryList ? queryList.filter(queryWord => queryWord.length >= 1) : [];

    const negatedQuery = negatedQueryList ? negatedQueryList.filter(queryWord => queryWord.length >= 1): [[]];
    
    
    
    if (negatedQueryList[0].length ===  0){
        if (platform === PLATFORM_ONLINE_NEWS){
            if (anyAll === "any") {
                fullQuery = `${query.join(" OR ")}`;
            } else {
                fullQuery = `${query.join(" AND ")}`;
            }
        }else if (platform === PLATFORM_REDDIT) {
            if (anyAll === "any") {
                fullQuery = `${query.join("|")}`;
            } else {
                fullQuery = `${query.join("+")}`;
            }
        } else if (platform === PLATFORM_YOUTUBE) {
            if (anyAll === "any") {
                fullQuery = `${query.join("|")}`;
            } else {
                fullQuery = `${query.join(" ")}`;
            }
        } else if (platform === PLATFORM_TWITTER) {
            if (anyAll === "any") {
                fullQuery = `${query.join(" or ")}`;
            } else {
                fullQuery = `${query.join(" ")}`;
            }
        }

    } else {
        if (platform === PLATFORM_ONLINE_NEWS) {
            if (anyAll === "any"){
                fullQuery = `(${query.join(" OR ")}) AND NOT (${negatedQuery.join(" OR ")})`;
            }else {
                fullQuery = `(${query.join(" AND ")}) AND NOT (${negatedQuery.join(" OR ")})`;
            }
        } else {
            fullQuery = `(${query.join(" ")}) -${negatedQuery.join(" -")}`;
        }
    }
    
    return fullQuery;
};