import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useSnackbar } from 'notistack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';

import { useResetPasswordMutation } from '../../app/services/authApi';

export default function ConfirmedPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = useState({
    new_password: '', confirm_password: '', token: searchParams.get('token'),
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [reset, {
    isLoading, isError, error, isSuccess,
  }] = useResetPasswordMutation();

  useEffect(() => {
    if (isSuccess) {
      enqueueSnackbar('Password Reset!', { variant: 'success' });
      navigate('/sign-in');
    }
  }, [isSuccess]);

  if (isLoading) {
    <CircularProgress size="75px" />;
  }

  return (
    <div style={isError ? { paddingTop: '0px' } : { paddingTop: '100px' }}>
      {isError && (
        <div>
          <Alert severity="error">
            {error.data.error ? error.data.error
              : 'There was an error resetting your password, please try again.'}
          </Alert>
        </div>
      )}
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

        <Box
          component="form"
          method="post"
          noValidate
          sx={{ mt: 1 }}
        >

          {/* Password */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="new_password"
            label="Password"
            type="password"
            autoComplete="new-password"
            onChange={handleChange}
          />

          {/* Confirm Password */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirm_password"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            onChange={handleChange}
          />

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={async () => {
              await reset(formState);
            }}
          >
            Reset Password
          </Button>

        </Box>
      </Box>
    </div>

  );
}
