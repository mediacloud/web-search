import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useDispatch } from 'react-redux'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import { useSnackbar } from 'notistack';

import { saveCsrfToken } from '../../services/CsrfToken';
import { useLoginMutation } from '../../app/services/authApi';
import { setCredentials } from './authSlice';


export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // formstate -> login
  const [login, { isLoading }] = useLoginMutation();

  // username and password
  const [formState, setFormState] = React.useState({ username: '', password: '' });
<<<<<<< HEAD
  
  // errors 
=======
  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // errors
>>>>>>> dc2294916445868265f7f070d39d46ccc39fa328
  const [errorState, setErrorState] = React.useState();

  const handleChange = ({ target: { name, value }}) => setFormState((prev) => ({ ...prev, [name]: value }))

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

          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          <Box
            component="form"
            action='accounts/login'
            method='post'
            href='accounts/login'
            noValidate sx={{ mt: 1 }}
          >

            {errorState && <Alert severity="error">Failed to sign in</Alert>}

            {/* Username  */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="text"
              label="Username"
              name="username"
              autoComplete="Username"
              autoFocus
              onChange={handleChange}
            />

            {/* Password  */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={handleChange}
            />

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={ isLoading }
              onClick={async () => {
                try {
                  setErrorState(null);
                  const user = await login(formState).unwrap();
                  dispatch(setCredentials(user));
                  navigate("/");
                  enqueueSnackbar("You are now signed in", { variant: 'success'});
                  // the CSRF token changes because we've launched a new session - save the new one
                  saveCsrfToken();
                } catch (err) {
                  console.log(err);
                  setErrorState(err.data.message);
                  enqueueSnackbar("Login failed", { variant: 'error'});
                }
              }}
            >
              Sign In
            </Button>

          </Box>
        </Box>
      </div>

  );
}
