import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useDispatch } from 'react-redux'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';

import { useSelector } from 'react-redux';

import { useState } from 'react';


import { setVerification } from './authSlice';

import { useSendEmailMutation, useEmailExistsMutation } from '../../app/services/authApi';


import { selectVerificationKey } from './authSlice';

export default function ResetPassword() {
  const dispatch = useDispatch();

  // formstate -> login
  const [send, { isSend }] = useSendEmailMutation();
  const [exists, { isEmail }] = useEmailExistsMutation();


  // email
  const [formState, setFormState] = React.useState({
    email: '', verification: '',
  });


  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

  const [isShown, setIsShown] = useState(false);

  const verificationKey = useSelector(selectVerificationKey);


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

          {!isShown && (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {

                // does the email exist? 
                const emailExists = await exists(formState).unwrap();

                if (emailExists) {
                  setIsShown(true)
                  const key = await send(formState).unwrap();
                  console.log(key)
                  dispatch(setVerification(key));
                }
              }}
            >
              Send Login Link
            </Button>
          )}
         
          {isShown && (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={async () => {
                console.log(verificationKey)
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
