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

import { useGiveAPIAccessMutation } from '../../app/services/authApi';

export default function GetApiAccess() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [giveAccess, {
    isLoading, isError, error, isSuccess,
  }] = useGiveAPIAccessMutation();

  useEffect(() => {
    if (token) {
      giveAccess({ token });
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
            Getting API Access...
          </Typography>

          <Alert severity="info">
            Please wait while you are granted API Access
          </Alert>

          <CircularProgress size="75px" />
        </Box>
      </Container>
    </div>;
  }

  if (isSuccess) {
    navigate('/account');
    navigate(0);
    enqueueSnackbar('API Access Granted!', { variant: 'success' });
  }

  if (isError) {
    enqueueSnackbar('There was an error granting API Access, please try again.', { variant: 'error' });
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
                : 'There was an error granting API Access, please try again.'}
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
            Get API Access
          </Typography>

        </Box>
      </Container>
    </div>
  );
}
