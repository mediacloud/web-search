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

import { useResetPasswordMutation } from '../../app/services/authApi';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();


  const [email, setEmail] = useState("")

  const [reset, {isResetting} ] = useResetPasswordMutation();



  const handleChange = (event) => {
     setEmail(event.target.value)
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
                autoComplete="Email"
                autoFocus
                onChange={handleChange}
              />
           
            {/* Sending Email */}
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={async () => {

                  try {
                    const resetPassword = await reset(email).unwrap();

                    console.log(resetPassword.message)
                  } catch (err) {
                    console.log(err); 
                  }
                }}
              >
                Send Login Link
              </Button>


          </Box>
        </Box>
      </Container>
    </div>
  );
}