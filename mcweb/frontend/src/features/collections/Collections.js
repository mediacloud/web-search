import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { palette } from '@mui/system';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function Width() {
  return (
    <div style={{ paddingTop: "100px" }}>
      <Box sx={{
        width: '100%', height: '100vh', bgcolor: 'primary.main' }}>

        <Grid container spacing={2}>
          <Grid item md={8}>
            <Item>Item 1</Item>
          </Grid>
          <Grid item md={4}>
            <Item>Item 2</Item>
          </Grid>
          <Grid item md={4}>
            <Item>Item 3</Item>
          </Grid>
          <Grid item md={8}>
            <Item>Item 4</Item>
          </Grid>
        </Grid>
        
        
      </Box>
    </div>
  );
}