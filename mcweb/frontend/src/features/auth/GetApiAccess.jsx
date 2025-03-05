import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { Container } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { useResetPasswordSendEmailQuery, useEmailExistsQuery } from '../../app/services/authApi';

export default function GetApiAccess() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [skip, setSkip] = useState(false);

  // change below to trigger email to send api access token
  const key = useResetPasswordSendEmailQuery(formState.email, { skip });

  return (
    <div style={{ paddingTop: '100px' }}>
      <Container maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >

          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            {/* change icon */}
            <LockOutlinedIcon titleAccess="admin only" />
          </Avatar>

          <Typography component="h1" variant="h5">
            Get API Access
          </Typography>

          <Alert severity="warning">
            Please do not refresh the page before entering
            the verification code that was emailed to you
          </Alert>

          <Box
            component="form"
            method="post"
            noValidate
            sx={{ mt: 1 }}
          >
            {/* Verification Code */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="text"
              label="Verification Code"
              name="verification"
              autoFocus
              onChange={handleChange}
            />

            {/* Is the users key the real key? */}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {
                // comparing the textFeild with the returned key from sendEmail
                if (formState.verification === key.data.Key) {
                  enqueueSnackbar('Verified', { variant: 'success' });
                  navigate('confirmed');
                } else {
                  enqueueSnackbar('Incorrect Verification', { variant: 'error' });
                }
              }}
            >
              Verify
            </Button>

          </Box>
        </Box>
      </Container>
    </div>
  );
}
