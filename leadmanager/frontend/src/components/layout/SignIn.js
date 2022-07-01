import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { Link } from 'react-router-dom';

const theme = createTheme();

export default function SignIn() {

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        console.log({
            email: data.get('email'),
            password: data.get('password'),
        });
    };

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    return (

        <div style={{ paddingTop: "100px" }}>
            <form
                 action='accounts/login'
                 method='post'
                 href='accounts/login'
            
                >
                <input type="text" name='username' placeholder='username' />
                <input type="password" name='password' placeholder='password' />
                <input type="Submit"></input>

            </form>
        </div >

        // <div style={{ paddingTop: "100px" }}>
        //     <CssBaseline />
        //     <Box
        //         sx={{
        //             marginTop: 8,
        //             display: 'flex',
        //             flexDirection: 'column',
        //             alignItems: 'center',
        //         }}
        //     >
        //         <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        //             <LockOutlinedIcon />
        //         </Avatar>
        //         <Typography component="h1" variant="h5">
        //             Sign in
        //         </Typography>
        //         <Box
        //             component="form"
        //             onSubmit={handleSubmit}
        //             noValidate sx={{ mt: 1 }}>

        //             <TextField
        //                 margin="normal"
        //                 required
        //                 fullWidth
        //                 id="email"
        //                 label="Email Address"
        //                 name="email"
        //                 autoComplete="email"
        //                 autoFocus
        //             />
        //             <TextField
        //                 margin="normal"
        //                 required
        //                 fullWidth
        //                 name="password"
        //                 label="Password"
        //                 type="password"
        //                 id="password"
        //                 autoComplete="current-password"
        //             />
        //             {/* <FormControlLabel
        //                 control={<Checkbox value="remember" color="primary" />}
        //                 label="Remember me"
        //             /> */}
        //             <Button
        //                 type="submit"
        //                 fullWidth
        //                 variant="contained"
        //                 sx={{ mt: 3, mb: 2 }}
        //             >
        //                 Sign In
        //             </Button>

        //         </Box>
        //     </Box>
        // </div>

    );
}