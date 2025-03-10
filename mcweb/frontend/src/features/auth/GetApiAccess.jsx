import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { Container } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { useGetAPIAccessTokenQuery, useLazyGiveAPIAccessQuery } from '../../app/services/authApi';

export default function GetApiAccess() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = useState({ verification: '' });

  const { isLoading, data } = useGetAPIAccessTokenQuery();

  const [
    apiAccessTrigger,
    { isFetching, data: apiAccessData },
  ] = useLazyGiveAPIAccessQuery();

  console.log('DATA', data);
  console.log('KEYY', apiAccessData);

  if (isLoading) {
    return (
      <div>
        <Alert severity="warning">
          Please wait while an email is sent to you with a verification code,
          this may take a moment, please do not refresh the page.
        </Alert>
        <CircularProgress size="75px" />
      </div>
    );
  }

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
              onChange={(e) => setFormState({ verification: e.target.value })}
            />

            {/* Is the users key the real key? */}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {
                // comparing the textFeild with the returned key from sendEmail
                if (formState.verification === data.Key) {
                  await apiAccessTrigger();
                  navigate('/account');
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
