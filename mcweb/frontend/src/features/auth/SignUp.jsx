import * as React from 'react';
import { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import { useSnackbar } from 'notistack';
import { useNavigate, Link } from 'react-router-dom';
import { CsrfToken } from '../../services/csrfToken';
import { useRegisterMutation, usePasswordStrengthMutation, useRequestResetCodeEmailMutation } from '../../app/services/authApi';

export default function SignUp() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // register user
  const [register, { isLoading, error: isRegisterError }] = useRegisterMutation();

  const [requestResetEmail, { isLoading: isLoadingEmail, isError }] = useRequestResetCodeEmailMutation();

  // a list of the errors
  const [listOfErrors, setListOfErrors] = useState([]);

  // disable button if password isn't validated
  const [show, setShow] = useState(true);

  // credentials
  const [formState, setFormState] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    password1: '',
    password2: '',
    notes: '',
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value.trim() }))
  );

  // list of password validators (ex: password is too short, no numbers, no special characters ...)
  const [passwordStrength] = usePasswordStrengthMutation();

  useEffect(() => {
    async function fetchData() {
      const data = await passwordStrength({
        password1: formState.password1,
        password2: formState.password2,
      }).unwrap();
      return data;
    }

    const fetchDataAndProcess = async () => {
      const data = await fetchData();

      if (data && data.length !== 0) {
        const newListOfErrors = data.map((error) => (
          <ul key={error} className="passwordStrength">
            <li key={error}>{error}</li>
          </ul>
        ));
        setListOfErrors(newListOfErrors);
        setShow(true);
      } else {
        setListOfErrors([]);
        setShow(false);
      }
    };
    fetchDataAndProcess();
  }, [formState.password1, formState.password2]);
  
  return (
    <div>
      <Container maxWidth="md">
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

          {isError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              There was an error sending the confirmation email, please refresh and try again.
            </Alert>
          )}

          {isRegisterError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              There was an error creating your account {isRegisterError.data.message} please refresh and try again.
            </Alert>
          )}

          <Typography component="h1" variant="h5">
            Sign up
          </Typography>

          <Typography component="h3" variant="h5">
            After Signing Up, please check your email to confirm your account.
          </Typography>

          <Box
            component="form"
            noValidate
            sx={{ mt: 3 }}
          >

            <Grid container spacing={2}>

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

              {/* list the errors */}
              {listOfErrors}

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  name="notes"
                  rows={4}
                  label="Tell us a little about why you want to use Media Cloud"
                  type="text"
                  onChange={handleChange}
                />
              </Grid>

            </Grid>

            {/* SignUp Button */}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || show}
              onClick={async () => {
                try {
                  // creating user
                  const user = await register(formState).unwrap();
                  await requestResetEmail({ email: user.email, reset_type: 'email-confirm' });
                  navigate('/');
                  enqueueSnackbar('Your account has been created, please check your email for a confirmation link', { variant: 'success' });
                } catch (err) {
                  const errorMsg = `Failed - ${err.data.message}`;
                  enqueueSnackbar(errorMsg, { variant: 'error' });
                }
              }}
            >
              Sign Up
            </Button>
          </Box>
          <Typography
            sx={{
              mr: 2,
              letterSpacing: '.02rem',
              color: 'light-blue',
              textDecoration: 'none',
            }}
            component={Link}
            to="/sign-in"
          >
            Already Have an Account? Sign-In!
          </Typography>
        </Box>
      </Container>
    </div>
  );
}
