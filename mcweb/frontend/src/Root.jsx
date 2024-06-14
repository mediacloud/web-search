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
import './style/Application.scss';

// Components
import * as Sentry from '@sentry/react';
import App from './App';

// Store
import getStore from './app/store';

// Sentry

const theme = createTheme({
  palette: {
    primary: {
      main: '#d24527',
      darker: '#2f2d2b',
    },
    contrast: {
      main: '#fff',
    },
  },
  Typography: {
    fontFamily: ['Lato, Helvetica, sans'],
  },
  overrides: { // Name of the component ⚛️ / style sheet
    MuiButton: {
      root: {
        padding: '5px 16px',
        fontFamily: 'Lato, Helvetica, sans',
        fontWeight: 300,
      },
      containedPrimary: {
        color: 'white',
      },
      outlined: {
        color: '#2f2d2b',
      },
      text: {
        fontFamily: 'Lato, Helvetica, sans',
        fontWeight: 300,
      },
    },
    MuiInputLabel: {
      root: {
        fontFamily: 'Lato, Helvetica, sans',
      },
    },
  },
});

Sentry.init({
  
  dsn: 'https://5379abd35ad573aaa8b239552bf28393@o33894.ingest.sentry.io/4506751471321093',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  //environment: ENV // I'd really like to be able to get an environment in here dynamically- any thoughts?
  // Performance Monitoring
  tracesSampleRate: 1.0,//  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [/^https:\/\/search\.mediacloud\.org/, "/^http:\/\/localhost:8000/"],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%.
  replaysOnErrorSampleRate: 1.0,
  _experiments:{
    profilesSampleRate: 1.0
  },
  shouldCreateSpanForRequest: (url) => true,
});

function Root() {
  return (
    <Provider store={getStore()}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
          <Box>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </Box>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

const renderApp = () => {
  createRoot(document.getElementById('app'))
    .render(<Root />);
};

export default renderApp;
