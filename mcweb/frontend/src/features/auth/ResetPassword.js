import * as React from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { useSendEmailMutation, useEmailExistsMutation } from '../../app/services/authApi';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // formstate -> login
  const [send, { isSend }] = useSendEmailMutation();
  const [exists, { isEmail }] = useEmailExistsMutation();

  // email
  const [formState, setFormState] = React.useState({
    email: '', verification: '', 
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  const [isShown, setIsShown] = useState({
    show: false,
    key: null
  });


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
          {/* Email  */}
          {!isShown.show && (
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

          {isShown.show && (
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

          {!isShown.show && (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {

                // does the email exist? 
                const emailExists = await exists(formState).unwrap();
                const emailBoolean = JSON.stringify(emailExists).substring(10,14)

                if (emailBoolean === "true") {
                  enqueueSnackbar("Email Sent", { variant: 'success' });
                  // send email and store the returned key 
                  const code = await send(formState).unwrap();
                
                  // set show to true to change scene 
                  // set key to the code returned 
                  setIsShown({
                    show: true,
                    key: code,
                  })
                  }
                else {
                  enqueueSnackbar("Email does not exist", { variant: 'error' });
                }
              }}
            >
              Send Login Link
            </Button>
          )}

          {isShown.show && (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {
                const stringVerification = JSON.stringify(isShown.key).substring(8, 16)
    
                if (formState.verification === stringVerification) {
                   enqueueSnackbar("Verified", { variant: 'success' });
                   navigate('confirmed')
                 } else {
                   enqueueSnackbar("Incorrect Verification", { variant: 'error' });
                 }

              }}
            >
              Verify
            </Button>
          )}

        </Box>
      </Box>
    </div>

  );
}
