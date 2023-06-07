import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { Container } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { useResetPasswordSendEmailQuery, useEmailExistsQuery } from '../../app/services/authApi';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = useState({
    email: '', verification: '',
  });

  const [skip, setSkip] = useState(false);

  const key = useResetPasswordSendEmailQuery(formState.email, { skip });
  const verify = useEmailExistsQuery(formState.email);

  const handleChange = ({ target: { name, value } }) => (
    setFormState((prev) => ({ ...prev, [name]: value }))
  );

  const [isShown, setIsShown] = useState(false);

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

          <Box
            component="form"
            method="post"
            noValidate
            sx={{ mt: 1 }}
          >
            {/* Email  */}
            {!isShown && (
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
            )}
            {/* Verification Code */}
            {isShown && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="text"
                label="Verification Code"
                name="verification"
                autoFocus
                onChange={handleChange}
              />
            )}
            {/* Does the email exist in the DB */}
            {!isShown && (
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={async () => {
                  const exists = verify.data.Exists;

                  if (exists) {
                    enqueueSnackbar('Email Sent', { variant: 'success' });

                    // calls key query when email exists
                    setSkip(false);

                    // set show to true to change scene
                    setIsShown(true);
                  } else {
                    enqueueSnackbar('Email does not exist', { variant: 'error' });
                  }
                }}
              >
                Send Login Link
              </Button>
            )}

            {/* Is the users key the real key? */}
            {isShown && (
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={async () => {
                  // comparing the textFeild with the returned key from sendEmail
                  if (formState.verification === key.data.Key) {
                    enqueueSnackbar('Verified', { variant: 'success' });
                    navigate('confirmed');
                  } else {
                    enqueueSnackbar('Incorrect Verification', { variant: 'error' });
                  }
                }}
              >
                Verify
              </Button>
            )}

          </Box>
        </Box>
      </Container>
    </div>
  );
}
