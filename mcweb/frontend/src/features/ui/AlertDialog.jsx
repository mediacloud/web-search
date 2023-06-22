import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';

export default function AlertDialog({
  openDialog, outsideTitle, title, content, action, actionTarget, dispatchNeeded,
  snackbar, snackbarText, variant, endIcon, navigateNeeded, navigateTo, secondAction,
  confirmButtonText,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const navigate = useNavigate();

  const [open, setOpen] = React.useState(openDialog);

  const dispatch = useDispatch();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = async () => {
    if (dispatchNeeded) {
      try {
        await dispatch(action(actionTarget));
      } catch (error) {
        enqueueSnackbar(error, { variant: 'error' });
      }
    } else {
      action(actionTarget);
    }
    if (secondAction) {
      dispatch(secondAction());
    }
    if (snackbar) {
      enqueueSnackbar(snackbarText, { variant: 'success' });
    }
    if (navigateNeeded) {
      navigate(navigateTo);
    }
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClickOpen}
        endIcon={endIcon}
      >
        {outsideTitle}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleClose}

          >
            Cancel

          </Button>
          <Button
            variant="contained"
            onClick={handleClick}
            autoFocus
          >
            {confirmButtonText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

AlertDialog.propTypes = {
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
  endIcon: PropTypes.element,
  navigateNeeded: PropTypes.bool,
  navigateTo: PropTypes.string,
  secondAction: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  confirmButtonText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

AlertDialog.defaultProps = {
  snackbar: false,
  snackbarText: '',
  variant: 'text',
  endIcon: null,
  navigateNeeded: false,
  navigateTo: '',
  secondAction: null,
};
