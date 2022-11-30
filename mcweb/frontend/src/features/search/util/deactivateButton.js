import dayjs from "dayjs";


const deactvateButton = (queryObject) => {
  const {
    queryString,
    queryList,
    negatedQueryList,
    startDate,
    endDate,
  } = queryObject;
  
  
  
  const totalQuery = queryList.concat(negatedQueryList)
  
  // is the query string empty? 
  const isQueryEmpty = validQuery(totalQuery)

  // are the dates in correct order? 
  const areDatesValid = validDates(startDate, endDate); 

  // is the advanced search query empty? 
  const isQueryStringEmpty = validQueryString(queryString)
  


  return ((isQueryEmpty || isQueryStringEmpty) && areDatesValid)
  
}

// checks too see if the query is empty 
function validQuery(totalQuery) {
  for(let i = 0; i < totalQuery.length; i++) {
    if(totalQuery[i].length > 0) {
      return true; 
    }
  }
  return false; 
}

// checks to see if the startDAte is before the endDAte
function validDates(startDate, endDate) {
  return dayjs(startDate).isBefore(dayjs(endDate));
}

// is the advanced search query string not just the "*"
function validQueryString(queryString) {
  return queryString.length > 1; 
}


export default deactvateButton