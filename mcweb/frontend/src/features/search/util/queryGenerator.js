const PLATFORM_ONLINE_NEWS = 'onlinenews';
export const queryGenerator = (queryList, negatedQueryList, platform, anyAll) => {
    // turn queryList, negatedQueryList arrays into strings (Join)
    // Join based on the platform (and or etc)
    let fullQuery = "";
    if (negatedQueryList === "") {
        fullQuery = `${queryList}`;
    } else {
        if (platform === PLATFORM_ONLINE_NEWS) {
            fullQuery = `(${queryList}) AND NOT (${negatedQueryList})`;
        } else {
            fullQuery = `(${queryList}) -${negatedQueryList}`;
        }

    }
    return fullQuery;
};