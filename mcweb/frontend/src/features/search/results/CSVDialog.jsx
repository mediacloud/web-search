import * as React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import prepareQueries from '../util/prepareQueries';

export default function CSVDialog({
  openDialog, queryState, downloadType, outsideTitle, title, content, action, actionTarget,
  snackbar, snackbarText, variant, startIcon, secondAction,
  confirmButtonText,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = React.useState(openDialog);

  const query = prepareQueries(queryState);

  const handleDownloadRequest = () => {
    const url = getDownloadURL(downloadType);
    window.location = `/api/search/${url}?qS=${encodeURIComponent(JSON.stringify(query))}`;
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = async () => {
    if (snackbar) {
      enqueueSnackbar(snackbarText, { variant: 'success' });
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClickOpen}
        startIcon={startIcon}
      >
        {outsideTitle}
        ...
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {title}
          Choose Which Query You Would Like to Download A CSV
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          {/* Table with each query and a button to download */}
          {queryState.map((querySlice) => {

          })}
          {/* Additional button to download all CSVs */}
          <Button
            variant="outlined"
            onClick={handleClose}

          >
            Cancel
          </Button>
          <Box>
            <Button
              variant="contained"
              onClick={handleClick}
              autoFocus
            >
              {confirmButtonText}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}

CSVDialog.propTypes = {
  openDialog: PropTypes.bool.isRequired,
  outsideTitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  action: PropTypes.func.isRequired,
  actionTarget: PropTypes.oneOfType([PropTypes.object, PropTypes.bool, PropTypes.number]).isRequired,
  dispatchNeeded: PropTypes.bool.isRequired,
  snackbar: PropTypes.bool,
  snackbarText: PropTypes.string,
  variant: PropTypes.string,
  startIcon: PropTypes.element,
  navigateNeeded: PropTypes.bool,
  navigateTo: PropTypes.string,
  secondAction: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

CSVDialog.defaultProps = {
  snackbar: false,
  snackbarText: '',
  variant: 'text',
  startIcon: null,
  navigateNeeded: false,
  navigateTo: '',
  secondAction: null,
};
