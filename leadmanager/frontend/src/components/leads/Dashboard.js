
import React, { Fragment } from 'react';
import Form from './Form';
import Leads from './Leads';
import Alerts from '../layout/Alerts';

export default function Dashboard() {
  return (
    <Fragment>
      <Alerts />
      <Form />
      <Leads />
    </Fragment>
  );
}