// React
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

// Router
import { BrowserRouter } from 'react-router-dom';

// MUI Styling
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';

// Import our style sheet
import '../../frontend/src/style/Application.scss';

// Components
import App from './App';

const theme = createTheme();
// Store
import { getStore } from './app/store';


const Root = () => (
  <Provider store={getStore()}>
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3} autoHideDuration={1500}>
        <Box>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  </Provider >
);

export const renderApp = () => {
  createRoot(document.getElementById('app')).
    render( <Root />);
};


