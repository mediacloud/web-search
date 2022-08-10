import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Container } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';


import { CsrfToken } from '../../services/csrfToken';
import { useRegisterMutation } from '../../app/services/authApi';
import { setCredentials } from './authSlice';

export default function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // formstate -> login
  const [register, { isLoading }] = useRegisterMutation();

  // username and password
  const [formState, setFormState] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
  });
  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  // errors
  const [errorState, setErrorState] = React.useState();

  return (

    <div style={{ paddingTop: "50px" }}>
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
          <LockOutlinedIcon />

        </Avatar>

        <Typography component="h1" variant="h5">
          Sign up
        </Typography>

        <Box
          component="form"
          noValidate
          sx={{ mt: 3 }}
        >

          <Grid container spacing={2}>

            {/* Token  */}
            <CsrfToken />

            {/* First Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="first_name"
                autoComplete="given-name"
                autoFocus
                onChange={handleChange}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="last_name"
                type="name"
                autoComplete="family-name"
                onChange={handleChange}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                onChange={handleChange}
              />
            </Grid>

            {/* Username */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Username"
                name="username"
                type="text"
                autoComplete="username"
                onChange={handleChange}
              />
            </Grid>

            {/* Password */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password1"
                label="Password"
                type="password"
                autoComplete="new-password"
                onChange={handleChange}
              />
            </Grid>

            {/* Confirm Password */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password2"
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                onChange={handleChange}
              />
            </Grid>

          </Grid>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
            onClick={async () => {
              try {
                setErrorState(null);
                const user = await register(formState).unwrap();
                dispatch(setCredentials(user));
                navigate("/")
                enqueueSnackbar("We created an account for you.", { variant: 'success' });
              } catch (err) {
                const errorMsg = `Failed - ${err.data.message}`;
                setErrorState(errorMsg);
                enqueueSnackbar(errorMsg, { variant: 'error' });
              }
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Box>
    </Container>
    </div >
  );
}
