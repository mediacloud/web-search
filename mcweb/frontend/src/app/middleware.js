import { isRejectedWithValue } from '@reduxjs/toolkit';

/**
 * Log a warning and show a toast!
 */
const rtkQueryErrorLogger = (/* api */) => (next) => (action) => {
  // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood,
  // so we're able to utilize these matchers!
  if (isRejectedWithValue(action)) {
    let msg = 'Error';
    if (action.payload.data && (action.payload.data.status === 'error')) {
      msg += ` - ${action.payload.data.note}`;
    } else {
      msg += ` - ${action.error.message}`;
    }
    console.error(msg);
  }

  return next(action);
};

export default rtkQueryErrorLogger;
