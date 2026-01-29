import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';

import { saveCsrfToken } from '../../services/csrfToken';
import { useLoginMutation } from '../../app/services/authApi';
import { setCredentials } from './authSlice';

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const from = location.state?.from?.pathname || '/';
  // formstate -> login
  const [login, { isLoading, error }] = useLoginMutation();

  // username and password
  const [formState, setFormState] = React.useState({
    username: '', password: '',
  });

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value.trim() }))
  );

  return (
    <div className="containter">
      <div className="row">
        <div className="col-4 offset-4">
          <h1>Login</h1>
          {error && (
            <div className="alert alert-danger" role="alert">
              Login failed - {error.data?.message || 'Unknown error occurred'}
            </div>
          )}
          <Box
            component="form"
            method="post"
            noValidate
          >
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
            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              onChange={handleChange}
            />

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              onClick={async () => {
                try {
                  const user = await login(formState).unwrap();
                  dispatch(setCredentials(user));
                  navigate(from, { replace: true });
                  enqueueSnackbar('You are now signed in', { variant: 'success' });
                  // the CSRF token changes because we've launched a new session - save the new one
                  saveCsrfToken();
                } catch (err) {
                  const errorMsg = `Failed - ${err.data.message}`;
                  enqueueSnackbar(errorMsg, { variant: 'error' });
                }
              }}
            >
              Login
            </Button>

            <p>
              <Link to="/reset-password">
                Forgot password?
              </Link>
            </p>
            <p>
              <Link to="/sign-up">
                No Account? Register Now!
              </Link>
            </p>
          </Box>
        </div>
      </div>
    </div>
  );
}
