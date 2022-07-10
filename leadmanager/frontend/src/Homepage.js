// React
import React from 'react'
import { createTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';

import Header from './Header';

const Homepage = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Header />
    </Container>
  );
}

export default Homepage
