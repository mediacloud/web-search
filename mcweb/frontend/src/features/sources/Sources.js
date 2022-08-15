import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#99b9de' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.primary
}));

export default function Source() {
  return (
    <div style={{ paddingTop: "100px" }}>
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          <Item> Hello </Item>
        </Grid>
      </Box>
    </div>
  );
}