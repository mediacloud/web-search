import * as React from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useSnackbar } from 'notistack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';

import { useResetPasswordMutation } from '../../app/services/authApi';

export default function ConfirmedPassword() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = React.useState({
    username: '', password1: '', password2: '',
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  const [reset, { isResetting }] = useResetPasswordMutation();
  ;

  return (

    <div style={{ paddingTop: "100px" }}>
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
          <LockOutlinedIcon />
        </Avatar>

        <Typography component="h1" variant="h5" >
          Reset Password
        </Typography>

        <Box
          component="form"
          method='post'
          noValidate sx={{ mt: 1 }}
        >

          {/* Username */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="text"
            label="Username"
            name="username"
            autoFocus
            onChange={handleChange}
          />
          {/* Password */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password1"
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
            name="password2"
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
              try {
                const response = await reset(formState).unwrap();
                enqueueSnackbar("Password Reset!", { variant: 'success' });
                navigate('/sign-in')
              } catch(err) {
                enqueueSnackbar("Reset Failed", { variant: 'error' });
              }
            }
            }
          >
            Reset Password
          </Button>

        </Box>
      </Box>
    </div >

  );
}
