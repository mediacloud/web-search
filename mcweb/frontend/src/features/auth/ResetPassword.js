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
import { Grid } from '@mui/material/Grid';

import { useResetPasswordMutation } from '../../app/services/authApi';

export default function SignIn() {
  // formstate -> login
  const [reset, { isResetting }] = useResetPasswordMutation();

  // email
  const [formState, setFormState] = React.useState({
    email: ''
  });

  const handleChange = ({ target: { name, value } }) => setFormState((prev) => ({ ...prev, [name]: value }))

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


          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isResetting}
            onClick={async () => {
              const response = await reset(formState).unwrap();
              console.log(response)
            }}
          >
            Send Login Link
          </Button>
        </Box>
      </Box>
    </div>

  );
}
