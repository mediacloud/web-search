/**
 * RTK Query hands API failures back as STATE (an `error` object on the hook result),
 * not as a thrown exception, so nothing reaches an ErrorBoundary on its own.
 *
 * Call this during render to turn one into a real Error. The nearest ErrorBoundary
 * then catches it, shows the "Something went wrong" panel with copyable details,
 * and reports it to Sentry.
 *
 * The payload is whatever `error_response()` in mcweb/backend/search/views.py sent:
 *   { status: "error", note: <user friendly message>,
 *     exception?: <repr>, traceback?: <frame>, temporary?: true }
 */
export const API_ERROR_PAYLOAD = 'apiPayload';

export default function throwApiError(error) {
  if (!error) return;
  const note = error.note || error.error || error.message || 'Unknown error from the search API';
  const err = new Error(note);
  // `temporary` is set by the backend for transient conditions (an unreachable
  // Elasticsearch, a timeout); keeping it in the name makes the two cases easy to
  // tell apart in Sentry without digging into the payload
  err.name = error.temporary ? 'TemporarySearchApiError' : 'SearchApiError';
  err[API_ERROR_PAYLOAD] = error;
  throw err;
}
