import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { Container } from '@mui/material';
import { useSnackbar } from 'notistack';

import { useEmailConfirmedMutation } from '../../app/services/authApi';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [confirmedEmail, {
    isLoading, isError, error, isSuccess,
  }] = useEmailConfirmedMutation();

  useEffect(() => {
    if (token) {
      confirmedEmail({ token });
    }
  }, []);

  if (isLoading) {
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
            Confirming Email...
          </Typography>

          <Alert severity="info">
            Please wait while we confirm your email and grant API Access.
          </Alert>

          <CircularProgress size="75px" />
        </Box>
      </Container>
    </div>;
  }

  if (isSuccess) {
    navigate('/sign-in');
    navigate(0);
    enqueueSnackbar('Email confirmed, you may now sign-in and API Access has been granted!', { variant: 'success' });
  }

  if (isError) {
    enqueueSnackbar('There was an error confirming your email, please refresh and try again.', { variant: 'error' });
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
              Error
            </Typography>

            <Alert severity="error">
              {error.data.error ? error.data.error
                : 'There was an error confirming your email, please refresh and try again.'}
            </Alert>
          </Box>
        </Container>
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
            Confirm Email
          </Typography>

        </Box>
      </Container>
    </div>
  );
}
