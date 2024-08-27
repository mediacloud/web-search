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

const config = window.sentry_config
Sentry.init({
  
  dsn: config.sentry_dsn,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  environment: config.sentry_env,
  // Performance Monitoring
  tracesSampleRate: config.traces_rate,
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [/^https:\/\/search\.mediacloud\.org/, "/^http:\/\/localhost:8000/"],
  // Session Replay
  replaysSessionSampleRate: config.replay_rate,
  replaysOnErrorSampleRate: 1.0,
  _experiments:{
    profilesSampleRate: config.traces_rate
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
