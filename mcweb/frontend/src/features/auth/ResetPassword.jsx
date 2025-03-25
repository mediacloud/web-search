import * as React from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { Container } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { useRequestResetCodeEmailMutation } from '../../app/services/authApi';

export default function ResetPassword() {
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = useState({
    email: '', verification: '',
  });

  const [requestResetEmail, { isLoading, error, isSuccess }] = useRequestResetCodeEmailMutation();

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  if (isLoading) {
    return <CircularProgress size="75px" />;
  }

  if (error) {
    enqueueSnackbar('There was an error sending the email, please refresh the page and try again.', { variant: 'error' });
    return (
      <div>
        <Alert severity="error">
          There was an error sending the email, please try again.
        </Alert>
      </div>
    );
  }

  if (isSuccess) {
    <Alert severity="success">
      A verification link has been sent to your email address.
    </Alert>;
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
            <LockOutlinedIcon titleAccess="admin only" />
          </Avatar>

          <Typography component="h1" variant="h5">
            Reset Password
          </Typography>

          <Alert severity="warning">
            Please enter your email to receive a link to reset your password.
          </Alert>

          <Box
            component="form"
            method="post"
            noValidate
            sx={{ mt: 1 }}
          >
            {/* Email  */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="text"
              label="Email"
              name="email"
              autoComplete="Email"
              autoFocus
              onChange={handleChange}
            />

            {/* Does the email exist in the DB */}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {
                requestResetEmail({ email: formState.email, reset_type: 'password' });
              }}
            >
              Email Reset Code
            </Button>

          </Box>
        </Box>
      </Container>
    </div>
  );
}
