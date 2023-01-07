import React, { useEffect } from 'react';

import Link from './Link';

export default function DefaultDates() {

  
  return (
    <>

      <Link amountOfTime="1" typeOfTime="month" />

      <Link amountOfTime="3" typeOfTime="month" />

      <Link amountOfTime="1" typeOfTime="year" />
    
    </>
  );
}
