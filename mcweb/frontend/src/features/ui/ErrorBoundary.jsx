import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { API_ERROR_PAYLOAD } from './apiError';

/**
 * Error boundaries are still the only way to catch a render-time crash in React 18
 * (there is no hook equivalent). This wraps Sentry's boundary, which is a class
 * component underneath, so we get the automatic Sentry report AND the event id to
 * show the user.
 *
 * NOTE: a boundary only catches errors thrown while RENDERING its children (plus
 * their lifecycle methods and constructors). It does NOT catch errors thrown in
 * event handlers, in setTimeout, or inside promise callbacks -- those still need
 * their own try/catch.
 */

// Plain text, because this gets pasted into Github issues, email and Slack.
export const formatErrorReport = (error, componentStack, eventId, label) => [
  'Media Cloud error report',
  `area:     ${label}`,
  `url:      ${window.location.href}`,
  `when:     ${new Date().toISOString()}`,
  `version:  ${(document.settings && document.settings.appVersion) || 'unknown'}`,
  `sentry:   ${eventId || 'not reported (no DSN, or Sentry blocked in the browser)'}`,
  `browser:  ${window.navigator.userAgent}`,
  `error:    ${(error && error.name) || 'Error'}: ${(error && error.message) || String(error)}`,
  '',
  'component stack:',
  ((componentStack || '').trim() || '(none)'),
  '',
  'stack:',
  (((error && error.stack) || '').trim() || '(none)'),
  // present when the crash came from throwApiError() -- the JSON the backend sent,
  // which carries the server-side exception repr and traceback frame
  ...(error && error[API_ERROR_PAYLOAD]
    ? ['', 'api response:', JSON.stringify(error[API_ERROR_PAYLOAD], null, 2)]
    : []),
].join('\n');

export function ErrorFallback({
  error, componentStack, eventId, label,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const report = formatErrorReport(error, componentStack, eventId, label);

  const handleCopy = () => {
    navigator.clipboard.writeText(report).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
      // clipboard can be blocked (no permission, or a non-secure origin), so at
      // least open the details so there is something to select by hand
      () => setShowDetails(true),
    );
  };

  return (
    <Alert severity="error" sx={{ my: 2 }}>
      <AlertTitle>Something went wrong</AlertTitle>
      <p>
        This part of the page (
        {label}
        ) ran into an error and could not be displayed.
        Please try again, reload the page, or send us details at support@mediacloud.org if the problem persists.
      </p>
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1,
      }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopy titleAccess="copy error details" />}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy error details'}
        </Button>
        <Button size="small" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide details' : 'Show details'}
        </Button>
      </Box>
      <Collapse in={showDetails}>
        <pre
          style={{
            marginTop: '1rem',
            padding: '0.5rem',
            maxHeight: '20rem',
            overflow: 'auto',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.05)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {report}
        </pre>
      </Collapse>
    </Alert>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.instanceOf(Error),
  componentStack: PropTypes.string,
  eventId: PropTypes.string,
  label: PropTypes.string.isRequired,
};

ErrorFallback.defaultProps = {
  error: null,
  componentStack: '',
  eventId: null,
};

export default function ErrorBoundary({ children, label }) {
  return (
    <Sentry.ErrorBoundary
      // this is a render prop, not a nested component definition -- Sentry calls it
      // with {error, componentStack, eventId, resetError} only when a crash happens
      // eslint-disable-next-line react/no-unstable-nested-components, react/jsx-props-no-spreading
      fallback={(props) => <ErrorFallback {...props} label={label} />}
      beforeCapture={(scope) => {
        scope.setTag('boundary', label);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  // short name for the part of the UI being wrapped, shown to the user and
  // sent to Sentry as a tag so we can tell boundaries apart
  label: PropTypes.string.isRequired,
};

ErrorBoundary.defaultProps = {
  children: null,
};
