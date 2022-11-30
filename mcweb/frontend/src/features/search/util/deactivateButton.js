import dayjs from "dayjs";


const deactvateButton = (queryObject) => {
  const {
    queryList,
    negatedQueryList,
    startDate,
    endDate,
  } = queryObject;
  
  
  const totalQuery = queryList.concat(negatedQueryList)
  
  const isEmpty = isTotalQueryEmpty(totalQuery)

  const correctDates = areCorrectDates(startDate, endDate); 


  return isEmpty && correctDates; 
  
}

// checks too see if the query is empty 
function isTotalQueryEmpty(totalQuery) {
  for(let i = 0; i < totalQuery.length; i++) {
    if(totalQuery[i].length > 0) {
      return true; 
    }
  }
  return false; 
}

// checks to see if the startDAte is before the endDAte
function areCorrectDates(startDate, endDate) {
  return dayjs(startDate).isBefore(dayjs(endDate));
}


export default deactvateButton