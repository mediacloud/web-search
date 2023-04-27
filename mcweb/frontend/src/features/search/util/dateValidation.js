// import dayjs from 'dayjs';

// export const validateDate = (currentDate, minDate, maxDate) => {
 
//    const daysBetweenMinAndtoDate = dayjs(toDate).diff(dayjs(toDateMin), 'day');

//     const daysBetweenToDateAndMax = dayjs(toDateMax).diff(dayjs(toDate), 'day');

//     const daysBetweenMinAndMax = dayjs(toDateMax).diff(dayjs(toDateMin), 'day');

//     const currentYear = dayjs(toDate).year();
//     const minYear = dayjs(toDateMin).year();
//     const maxYear = dayjs(toDateMax).year();

//     if (currentYear >= minYear && currentYear <= maxYear) {
//       if (daysBetweenMinAndtoDate <= daysBetweenMinAndMax && daysBetweenToDateAndMax <= daysBetweenMinAndMax) {
//         dispatch(setQueryProperty({ endDate: toDate.format('MM/DD/YYYY'), queryIndex, property: 'endDate' }));
//       }
//     }


//   // console.log('Min Date');
//   // getTime(minDate);

//   // console.log('Max Date');
//   // getTime(maxDate);
// };

// function getTime(date) {
//   const day = date.day();
//   const month = date.month();
//   const year = date.year();

//   console.log(new Date(year, month, day));
// }
