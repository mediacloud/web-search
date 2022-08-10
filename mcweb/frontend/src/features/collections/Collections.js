import * as React from 'react';
import Box from '@mui/material/Box';
export default function Width() {
  return (
    <div style={{ paddingTop: "100px" }}>
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            width: 'auto',
            p: 1,
            bgcolor: 'blue',
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          Width auto
        </Box>
      </Box>
    </div>
  );
}