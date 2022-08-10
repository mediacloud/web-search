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
        width: '100%', height: '80vh', bgcolor: 'primary.main'
      }}>

        <Grid container spacing={2}>
          <Grid item md={2}>
            <Item>Total Stories: </Item>
          </Grid>
          <Grid item md={2}>
            <Item>Covered Since: </Item>
          </Grid>
          <Grid item md={2}>
            <Item>Collections: </Item>
          </Grid>
          <Grid item md={2}>
            <Item>Stories per Day: </Item>
          </Grid>
          <Grid item md={2}>
            <Item>With Entities: </Item>
          </Grid>
          <Grid item md={2}>
            <Item>With Themes: </Item>
          </Grid>


          <Grid item md={2.4}>
            <Item>Publication Country: </Item>
          </Grid>
          <Grid item md={2.4}>
            <Item>Publication State: </Item>
          </Grid>
          <Grid item md={2.4}>
            <Item>Detected Primary Language: </Item>
          </Grid>
          <Grid item md={2.4}>
            <Item>Detected Subject State: </Item>
          </Grid>
          <Grid item md={2.4}>
            <Item>Media Type: </Item>
          </Grid>
    
        </Grid>


      </Box>
    </div>
  );
}